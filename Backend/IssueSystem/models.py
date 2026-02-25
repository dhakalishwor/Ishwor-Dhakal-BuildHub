from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class ModerationProfile(models.Model):
    """
    store moderation flags without modifying User model.
    Auto-created when needed.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="moderation_profile",
    )
    is_flagged = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    reports_count = models.PositiveIntegerField(default=0)
    last_flagged_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"ModerationProfile(user={self.user_id}, flagged={self.is_flagged}, blocked={self.is_blocked})"


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ("PAYMENT", "Payment"),
        ("BID", "Bid"),
        ("PROJECT", "Project"),
        ("CHAT", "Chat Message"),
        ("ACCOUNT", "Account"),
        ("BUG", "Bug"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("REJECTED", "Rejected"),
    ]

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_made",
    )

    title = models.CharField(max_length=255, default="No Title")
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    description = models.TextField()
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="LOW"
    )
    attachment = models.FileField(upload_to="reports/attachments/", null=True, blank=True)

    # Generic target (user/project/chat/payment/etc)
    target_content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, blank=True
    )
    target_object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey("target_content_type", "target_object_id")

    #if your report is directly about a user
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reports_received",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="OPEN")
    admin_note = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report(#{self.id}) {self.title} by {self.reporter_id}"