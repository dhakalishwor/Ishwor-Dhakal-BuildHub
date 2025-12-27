from rest_framework import serializers
from .models import Contractor


class ContractorSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name", required=False)
    contractorType = serializers.CharField(source="contractor_type", required=False)
    workType = serializers.CharField(source="work_type", required=False)
    experienceYears = serializers.IntegerField(source="experience_years", required=False)
    availabilityStatus = serializers.CharField(source="availability_status", required=False)
    rateType = serializers.CharField(source="rate_type", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    projectTypes = serializers.ListField(
        source="project_types",
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Contractor
        fields = [
            "id",
            "fullName",
            "contractorType",
            "workType",
            "experienceYears",
            "phone",
            "email",
            "availabilityStatus",
            "rateType",
            "address",
            "projectTypes",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]
