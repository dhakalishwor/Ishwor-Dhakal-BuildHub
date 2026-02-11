from rest_framework import serializers
from django.db.models import Avg, Count
from .models import Contractor
from RecommendationSystem.models import Project

class ContractorSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    projectTypes = serializers.JSONField(source="project_types", required=False, default=list)
    experienceYears = serializers.IntegerField(source="experience_years")
    contractorType = serializers.CharField(source="contractor_type", required=False)
    workType = serializers.CharField(source="work_type")
    phone = serializers.CharField()
    availabilityStatus = serializers.CharField(source="availability_status", required=False)
    rateType = serializers.CharField(source="rate_type", required=False)

    avgRating = serializers.SerializerMethodField()
    totalRatings = serializers.SerializerMethodField()

    class Meta:
        model = Contractor
        fields = [
            "id",
            "fullName",
            "email",
            "address",
            "projectTypes",
            "experienceYears",
            "contractorType",
            "workType",
            "phone",
            "availabilityStatus",
            "rateType",
            "avgRating",
            "totalRatings",
        ]

    def _rating_qs(self, obj: Contractor):
        if not obj.user_id:
            return Project.objects.none()

        return Project.objects.filter(
            assigned_contractor=obj.user,
            status="COMPLETED",
            rating__isnull=False,
        )

    def get_avgRating(self, obj):
        agg = self._rating_qs(obj).aggregate(avg=Avg("rating__rating"))
        val = agg["avg"] or 0
        return round(float(val), 2)

    def get_totalRatings(self, obj):
        agg = self._rating_qs(obj).aggregate(cnt=Count("rating"))
        return int(agg["cnt"] or 0)
