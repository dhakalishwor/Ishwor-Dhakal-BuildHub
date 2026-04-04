from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CLIENT = "client"
    ROLE_CONTRACTOR = "contractor"
    ROLE_WORKER = "worker"
    ROLE_ADMIN = "admin"

    ROLE_CHOICES = (
        (ROLE_CLIENT, "Client"),
        (ROLE_CONTRACTOR, "Contractor"),
        (ROLE_WORKER, "Worker"),
        (ROLE_ADMIN, "Admin"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CLIENT)

    def __str__(self):
        return f"{self.username} ({self.role})"


class ContractorLicense(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_VERIFIED = "VERIFIED"
    STATUS_REJECTED = "REJECTED"
    STATUS_UNDER_REVIEW = "UNDER_REVIEW"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_UNDER_REVIEW, "Under Review"),
    )

    contractor = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="contractor_license",
        limit_choices_to={"role": User.ROLE_CONTRACTOR},
    )

    license_document = models.FileField(upload_to="contractor_licenses/")
    citizenship_document = models.FileField(
        upload_to="contractor_citizenships/",
        null=True,
        blank=True
    )

    extracted_name = models.CharField(max_length=255, blank=True)
    match_score = models.FloatField(null=True, blank=True)

    # Verification results
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    rejection_reason = models.TextField(blank=True)

    # re-upload attempts
    attempts = models.PositiveIntegerField(default=0)

    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"ContractorLicense({self.contractor.username}) - {self.status}"


class ClientProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="client_profile",
        limit_choices_to={"role": User.ROLE_CLIENT},
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to="client_profiles/", null=True, blank=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"