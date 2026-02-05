from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    assigned_contractor = serializers.IntegerField(source="assigned_contractor_id", read_only=True)
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "category",
            "location",
            "description",
            "budget",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "assigned_contractor",
            "rating",
            "payment_status",
            "final_amount",
        ]
        read_only_fields = ["id", "status", "created_at", "assigned_contractor", "rating"]

    def get_rating(self, obj):
        r = getattr(obj, "rating", None)
        if not r:
            return None
        return {
            "id": r.id,
            "rating": r.rating,
            "feedback": r.feedback,
            "created_at": r.created_at,
        }
