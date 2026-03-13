from rest_framework import serializers
from .models import Project
from ContractorManagement.serializers import ContractorSerializer
from ProgressTracking.models import ProjectAssignment


class ProjectSerializer(serializers.ModelSerializer):
    assigned_contractor = serializers.IntegerField(source="assigned_contractor_id", read_only=True)
    contractor_details = ContractorSerializer(source="assigned_contractor.contractor_profile", read_only=True)
    assigned_workers = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    milestones = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "category",
            "location",
            "latitude",
            "longitude",
            "description",
            "budget",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "assigned_contractor",
            "contractor_details",
            "assigned_workers",
            "rating",
            "payment_status",
            "final_amount",
            "hiring_model",
            "daily_rate",
            "advance_paid",
            "work_completed",
            "milestones",
        ]
        read_only_fields = ["id", "status", "created_at", "assigned_contractor", "rating"]

    def get_milestones(self, obj):
        from ProgressTracking.models import Milestone
        from ProgressTracking.serializers import MilestoneSerializer
        milestones = Milestone.objects.filter(project=obj).order_by("id")
        return MilestoneSerializer(milestones, many=True).data

    def get_assigned_workers(self, obj):
        assignments = ProjectAssignment.objects.filter(project=obj, status="ACTIVE").select_related("worker__worker_profile")
        return [
            {
                "id": a.worker.id,
                "username": a.worker.username,
                "fullName": getattr(getattr(a.worker, "worker_profile", None), "full_name", a.worker.username),
                "hiring_type": a.hiring_type,
            }
            for a in assignments
        ]

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
