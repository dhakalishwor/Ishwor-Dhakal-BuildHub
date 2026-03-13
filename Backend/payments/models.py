from django.db import models
from django.conf import settings

class Payment(models.Model):
    STATUS_CHOICES = [
        ("INITIATED", "Initiated"),
        ("COMPLETE", "Complete"),
        ("FAILED", "Failed"),
    ]

    PAYMENT_TYPE_CHOICES = [
        ("ADVANCE", "Advance"),
        ("MILESTONE", "Milestone"),
        ("FINAL", "Final"),
    ]

    project = models.ForeignKey(
        "RecommendationSystem.Project",
        on_delete=models.CASCADE,
        related_name="payments",
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_payments",
    )

    amount = models.PositiveIntegerField()

    transaction_uuid = models.CharField(max_length=50, unique=True)
    transaction_code = models.CharField(max_length=30, blank=True, default="")

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="INITIATED")
    payment_type = models.CharField(max_length=15, choices=PAYMENT_TYPE_CHOICES, default="FINAL")
    milestone = models.ForeignKey(
        "ProgressTracking.Milestone",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment({self.project_id}) {self.status}"
