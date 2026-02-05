from django.db import models
from django.conf import settings

class Payment(models.Model):
    STATUS_CHOICES = [
        ("INITIATED", "Initiated"),
        ("COMPLETE", "Complete"),
        ("FAILED", "Failed"),
    ]

    project = models.OneToOneField(
        "RecommendationSystem.Project",
        on_delete=models.CASCADE,
        related_name="payment",
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    amount = models.PositiveIntegerField()

    transaction_uuid = models.CharField(max_length=50, unique=True)
    transaction_code = models.CharField(max_length=30, blank=True, default="")

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="INITIATED")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment({self.project_id}) {self.status}"
