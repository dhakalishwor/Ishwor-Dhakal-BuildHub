from django.db import models
from django.conf import settings

class Bid(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
        ("WITHDRAWN", "Withdrawn"),
    )

    project = models.ForeignKey(
        "RecommendationSystem.Project",
        on_delete=models.CASCADE,
        related_name="bids"
    )
    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bids"
    )

    proposed_price = models.DecimalField(max_digits=12, decimal_places=2)
    proposed_days = models.PositiveIntegerField()
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    message = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("project", "contractor")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Bid({self.project_id}) by {self.contractor_id} - {self.status}"
