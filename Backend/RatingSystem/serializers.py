from rest_framework import serializers
from .models import Rating
from RecommendationSystem.models import Project

class RatingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ["id", "project", "rating", "feedback", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        user = self.context["request"].user
        role = (getattr(user, "role", "") or "").upper()
        if role != "CLIENT":
            raise serializers.ValidationError("Only clients can submit ratings.")

        project: Project = attrs["project"]

        if project.client_id != user.id:
            raise serializers.ValidationError("You can only rate your own project.")

        if project.status != "COMPLETED":
            raise serializers.ValidationError("You can only rate after project completion.")

        if project.assigned_contractor_id is None:
            raise serializers.ValidationError("No contractor assigned for this project.")

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        project = validated_data["project"]

        return Rating.objects.create(
            project=project,
            client=user,
            contractor=project.assigned_contractor,
            rating=validated_data["rating"],
            feedback=validated_data.get("feedback", "")
        )


class RatingListSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Rating
        fields = ["id", "project", "client_name", "contractor", "rating", "feedback", "created_at"]

    def get_client_name(self, obj):
        return getattr(obj.client, "full_name", None) or getattr(obj.client, "username", "Client")
