from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta

from .models import Report, ModerationProfile
from django.contrib.auth import get_user_model

User = get_user_model()


class ReportCreateSerializer(serializers.ModelSerializer):
    target_model = serializers.CharField(write_only=True, required=False)
    target_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "report_type",
            "description",
            "priority",
            "attachment",
            "reported_user",
            "target_model",
            "target_id",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        reporter = request.user

        report_type = attrs.get("report_type")
        desc = (attrs.get("description") or "").strip()
        if len(desc) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters.")

        reported_user = attrs.get("reported_user")
        target_model = (attrs.get("target_model") or "").strip().lower()
        target_id = attrs.get("target_id")

        # basic: cannot report self
        if reported_user and reported_user == reporter:
            raise serializers.ValidationError("You cannot report yourself.")


        if target_model and target_id:
            # duplicate spam control: same reporter + same target within 24 hours
            since = timezone.now() - timedelta(hours=24)
            qs = Report.objects.filter(reporter=reporter, created_at__gte=since).exclude(status="REJECTED")

            try:
                if "." in target_model:
                    app_label, model_name = target_model.split(".")
                    ct = ContentType.objects.get(app_label=app_label, model=model_name)
                else:
                    # try to find it by model name only if unique, or handle specifically
                    ct = ContentType.objects.get(model=target_model)
            except Exception:
                raise serializers.ValidationError("Invalid target_model. Use format: app_label.model_name or model_name")

            if qs.filter(report_type=report_type, target_content_type=ct, target_object_id=target_id).exists():
                raise serializers.ValidationError("You already reported this item within the last 24 hours.")

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        reporter = request.user

        target_model = validated_data.pop("target_model", None)
        target_id = validated_data.pop("target_id", None)
        validated_data.pop("reporter", None)

        ct = None
        if target_model and target_id:
            if "." in target_model:
                app_label, model_name = target_model.split(".")
                ct = ContentType.objects.get(app_label=app_label, model=model_name)
            else:
                ct = ContentType.objects.get(model=target_model)

        report = Report.objects.create(
            reporter=reporter,
            target_content_type=ct,
            target_object_id=target_id if ct else None,
            **validated_data
        )
        return report


class ReportListSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source="reporter.username", read_only=True)
    reported_user_username = serializers.CharField(source="reported_user.username", read_only=True)
    target_repr = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "report_type",
            "description",
            "priority",
            "attachment",
            "status",
            "admin_note",
            "reporter",
            "reporter_username",
            "reported_user",
            "reported_user_username",
            "target_repr",
            "created_at",
            "updated_at",
        ]

    def get_target_repr(self, obj: Report):
        if obj.target_content_type and obj.target_object_id:
            return f"{obj.target_content_type.app_label}.{obj.target_content_type.model}:{obj.target_object_id}"
        return None


class AdminReportUpdateSerializer(serializers.ModelSerializer):
    block_user = serializers.BooleanField(write_only=True, required=False)
    unblock_user = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Report
        fields = ["status", "admin_note", "block_user", "unblock_user"]

    def validate_status(self, value):
        allowed = {"OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"}
        if value not in allowed:
            raise serializers.ValidationError("Invalid status.")
        return value

    def update(self, instance, validated_data):
        block_user = validated_data.pop("block_user", False)
        unblock_user = validated_data.pop("unblock_user", False)

        instance = super().update(instance, validated_data)

        # moderation actions
        if instance.reported_user:
            mp, _ = ModerationProfile.objects.get_or_create(user=instance.reported_user)
            if block_user:
                mp.is_blocked = True
            if unblock_user:
                mp.is_blocked = False
            mp.save()

        return instance