from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CLIENT = "client"
    ROLE_CONTRACTOR = "contractor"
    ROLE_WORKER = "worker"

    ROLE_CHOICES = (
        (ROLE_CLIENT, "Client"),
        (ROLE_CONTRACTOR, "Contractor"),
        (ROLE_WORKER, "Worker"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CLIENT)

    def __str__(self):
        return f"{self.username} ({self.role})"


class ContractorLicense(models.Model):
    
    contractor = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="contractor_license",
        limit_choices_to={"role": User.ROLE_CONTRACTOR},
    )
    license_document = models.FileField(upload_to="contractor_licenses/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ContractorLicense({self.contractor.username})"
