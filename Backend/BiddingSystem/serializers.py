from rest_framework import serializers
from .models import Bid

class BidCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ["id", "project", "proposed_price", "proposed_days", "daily_rate", "message"]

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user

        if getattr(user, "role", None) not in ["contractor", "worker"]:
            raise serializers.ValidationError("Only contractors or workers can place bids.")

        project = attrs.get("project")
        if hasattr(project, "status") and project.status in ["CLOSED", "COMPLETED"]:
            raise serializers.ValidationError("This project is not open for bidding.")

        # Check if user already bid
        if Bid.objects.filter(project=project, contractor=user).exists():
            raise serializers.ValidationError("You have already submitted a bid for this project.")

        proposed_price = attrs.get("proposed_price")
        if proposed_price is not None and proposed_price < 0:
            raise serializers.ValidationError({"proposed_price": "Bid amount cannot be negative."})
            
        proposed_days = attrs.get("proposed_days")
        if proposed_days is not None and proposed_days <= 0:
            raise serializers.ValidationError({"proposed_days": "Proposed days must be at least 1."})
            
        daily_rate = attrs.get("daily_rate")
        if daily_rate is not None and daily_rate < 0:
            raise serializers.ValidationError({"daily_rate": "Daily rate cannot be negative."})

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["contractor"] = request.user
        return super().create(validated_data)


class BidListSerializer(serializers.ModelSerializer):
    contractor_name = serializers.SerializerMethodField()

    class Meta:
        model = Bid
        fields = [
            "id", "project", "contractor", "contractor_name",
            "proposed_price", "proposed_days", "daily_rate", "message",
            "status", "created_at"
        ]

    def get_contractor_name(self, obj):
        return getattr(obj.contractor, "full_name", None) or obj.contractor.username


class BidStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ["status"]

    def validate_status(self, value):
        allowed = {"ACCEPTED", "REJECTED"}
        if value not in allowed:
            raise serializers.ValidationError("Status can only be ACCEPTED or REJECTED.")
        return value
