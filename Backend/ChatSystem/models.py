from django.db import models
from django.conf import settings

class Conversation(models.Model):
    project = models.ForeignKey(
        "RecommendationSystem.Project", 
        on_delete=models.CASCADE,
        related_name="conversations"
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="client_conversations"
    )
    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="contractor_conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "client", "contractor")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Chat: {self.project.title} ({self.client.username} & {self.contractor.username})"

class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    content = models.TextField()
    is_system_message = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Msg from {self.sender.username} at {self.created_at}"
