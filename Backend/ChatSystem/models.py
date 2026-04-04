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
        related_name="client_conversations",
        null=True,
        blank=True
    )
    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="contractor_conversations"
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="worker_conversations",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.worker:
            return f"Chat: {self.project.title} (Contractor {self.contractor.username} & Worker {self.worker.username})"
        return f"Chat: {self.project.title} (Client {self.client.username} & Contractor {self.contractor.username})"

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
