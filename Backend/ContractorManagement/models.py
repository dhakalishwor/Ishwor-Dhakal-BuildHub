from django.db import models
from django.conf import settings


class Contractor(models.Model):
    CONTRACTOR_TYPE_INDIVIDUAL = "Individual"
    CONTRACTOR_TYPE_COMPANY = "Company"
    CONTRACTOR_TYPE_CHOICES = (
        (CONTRACTOR_TYPE_INDIVIDUAL, "Individual"),
        (CONTRACTOR_TYPE_COMPANY, "Company"),
    )

    AVAILABILITY_AVAILABLE = "Available"
    AVAILABILITY_BUSY = "Busy"
    AVAILABILITY_UNAVAILABLE = "Unavailable"
    AVAILABILITY_CHOICES = (
        (AVAILABILITY_AVAILABLE, "Available"),
        (AVAILABILITY_BUSY, "Busy"),
        (AVAILABILITY_UNAVAILABLE, "Unavailable"),
    )

    RATE_TYPE_HOURLY = "Hourly"
    RATE_TYPE_DAILY = "Daily"
    RATE_TYPE_PROJECT = "Project"
    RATE_TYPE_CHOICES = (
        (RATE_TYPE_HOURLY, "Hourly"),
        (RATE_TYPE_DAILY, "Daily"),
        (RATE_TYPE_PROJECT, "Project"),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contractor_profile",
        null=True,
        blank=True,
    )

    full_name = models.CharField(max_length=255)

    contractor_type = models.CharField(
        max_length=20,
        choices=CONTRACTOR_TYPE_CHOICES,
        default=CONTRACTOR_TYPE_INDIVIDUAL,
    )

    work_type = models.CharField(max_length=255)

    experience_years = models.PositiveIntegerField(default=0)

    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)

    availability_status = models.CharField(
        max_length=20,
        choices=AVAILABILITY_CHOICES,
        default=AVAILABILITY_AVAILABLE,
    )

    rate_type = models.CharField(
        max_length=20,
        choices=RATE_TYPE_CHOICES,
        default=RATE_TYPE_PROJECT,
    )

    address = models.CharField(max_length=200, blank=True, default="")
    project_types = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.full_name
