from django.db import models
from django.conf import settings


class Project(models.Model):
    CATEGORY_CHOICES = [
        ("CIVIL", "Civil"),
        ("ELECTRICAL", "Electrical"),
        ("PLUMBING", "Plumbing"),
        ("INTERIOR", "Interior"),
        ("PAINTING", "Painting"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("BIDDING", "Bidding"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
    ]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_projects",
    )

    title = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    location = models.CharField(max_length=150)
    description = models.TextField()
    budget = models.PositiveIntegerField()

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="BIDDING")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
