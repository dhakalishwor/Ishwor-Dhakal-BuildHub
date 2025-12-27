from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "location",
        "budget",
        "status",
        "client",
        "created_at",
    )

    list_filter = (
        "category",
        "status",
        "created_at",
    )

    search_fields = (
        "title",
        "location",
        "client__username",
        "client__email",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
    )
