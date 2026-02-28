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

    PAYMENT_STATUS_CHOICES = [
        ("UNPAID", "Unpaid"),
        ("PAID", "Paid"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("ESEWA", "eSewa"),
    ]

    HIRING_MODEL_CHOICES = [
        ("PER_DAY", "Per Day"),
        ("PER_PROJECT", "Per Project"),
    ]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_projects",
    )

    assigned_contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_projects",
    )

    title = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    location = models.CharField(max_length=150)
    latitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    description = models.TextField()
    budget = models.PositiveIntegerField()

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="BIDDING")
    
    hiring_model = models.CharField(
        max_length=20, 
        choices=HIRING_MODEL_CHOICES, 
        default="PER_PROJECT"
    )
    daily_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Daily rate if hiring model is Per Day"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default="UNPAID",
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHOD_CHOICES,
        null=True,
        blank=True,
    )
    final_amount = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.title
