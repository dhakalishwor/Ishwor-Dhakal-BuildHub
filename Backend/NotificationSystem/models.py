from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ("BID", "Bid"),
        ("PAYMENT", "Payment"),
        ("CHAT", "Chat"),
        ("ISSUE", "Issue"),
        ("PROGRESS", "Progress"),
        ("SYSTEM", "System"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    title = models.CharField(max_length=120)
    message = models.TextField(blank=True, default="")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="SYSTEM")

    # Frontend route to open when clicked
    link = models.CharField(max_length=255, blank=True, default="")

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_id} - {self.type} - {self.title}"