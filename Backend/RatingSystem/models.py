from django.db import models
from django.conf import settings

class Rating(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    project = models.OneToOneField(
        "RecommendationSystem.Project",
        on_delete=models.CASCADE,
        related_name="rating"
    )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="given_ratings"
    )

    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_ratings"
    )

    rating = models.IntegerField(choices=RATING_CHOICES)
    feedback = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rating} - Project {self.project_id}"
