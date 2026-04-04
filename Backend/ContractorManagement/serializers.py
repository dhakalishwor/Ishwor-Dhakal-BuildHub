from rest_framework import serializers
from django.db.models import Avg, Count
from .models import Contractor, WorkerProfile
from RecommendationSystem.models import Project
from ProgressTracking.models import ProjectAssignment
from RatingSystem.serializers import RatingListSerializer

class ContractorSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    projectTypes = serializers.JSONField(source="project_types", required=False, default=list)
    experienceYears = serializers.IntegerField(source="experience_years")
    contractorType = serializers.CharField(source="contractor_type", required=False)
    workType = serializers.CharField(source="work_type")
    phone = serializers.CharField()
    availabilityStatus = serializers.CharField(source="availability_status", required=False)
    rateType = serializers.CharField(source="rate_type", required=False)
    profilePicture = serializers.ImageField(source="profile_picture", required=False)
    id = serializers.SerializerMethodField()

    avgRating = serializers.SerializerMethodField()
    totalRatings = serializers.SerializerMethodField()
    feedbacks = serializers.SerializerMethodField()

    isActive = serializers.BooleanField(source="user.is_active", required=False)
    dateJoined = serializers.DateTimeField(source="user.date_joined", read_only=True)

    class Meta:
        model = Contractor
        fields = [
            "id",
            "fullName",
            "profilePicture",
            "email",
            "address",
            "projectTypes",
            "experienceYears",
            "contractorType",
            "workType",
            "phone",
            "availabilityStatus",
            "rateType",
            "isActive",
            "dateJoined",
            "avgRating",
            "totalRatings",
            "feedbacks",
        ]

    def get_id(self, obj):
        return obj.user_id

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        is_active = user_data.get("is_active")
        
        if is_active is not None and instance.user:
            instance.user.is_active = is_active
            instance.user.save()
            
        return super().update(instance, validated_data)

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

    def get_feedbacks(self, obj):
        from RatingSystem.models import Rating
        if not obj.user_id:
            return []
        ratings = Rating.objects.filter(contractor=obj.user).order_by("-created_at")
        return RatingListSerializer(ratings, many=True).data


class WorkerProfileSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    availabilityStatus = serializers.CharField(source="availability_status", required=False)
    dailyRate = serializers.DecimalField(source="daily_rate", max_digits=10, decimal_places=2, required=False)
    username = serializers.CharField(source="user.username", read_only=True)
    is_available = serializers.SerializerMethodField()
    experienceYears = serializers.IntegerField(source="experience_years", required=False)
    current_project = serializers.SerializerMethodField()
    profilePicture = serializers.ImageField(source="profile_picture", required=False)

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "username",
            "fullName",
            "profilePicture",
            "skills",
            "bio",
            "experienceYears",
            "specialization",
            "dailyRate",
            "availabilityStatus",
            "phone",
            "address",
            "created_at",
            "is_available",
            "current_project",
        ]

    def get_id(self, obj):
        return obj.user_id

    def get_is_available(self, obj):
        return not ProjectAssignment.objects.filter(
            worker=obj.user, status="ACTIVE"
        ).exists()

    def get_current_project(self, obj):
        active = ProjectAssignment.objects.filter(
            worker=obj.user, status="ACTIVE"
        ).select_related("project").first()
        if active:
            return {"id": active.project.id, "title": active.project.title}
        return None
