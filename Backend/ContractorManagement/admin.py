from django.contrib import admin
from .models import Contractor


@admin.register(Contractor)
class ContractorAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "contractor_type",
        "work_type",
        "experience_years",
        "availability_status",
        "rate_type",
        "created_at",
    )

    list_filter = (
        "contractor_type",
        "availability_status",
        "rate_type",
    )

    search_fields = (
        "full_name",
        "work_type",
        "phone",
        "email",
        "address",
    )

    ordering = ("-created_at",)
