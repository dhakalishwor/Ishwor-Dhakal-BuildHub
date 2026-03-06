from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message
from NotificationSystem.utils import notify


@receiver(post_save, sender=Message)
def notify_on_new_message(sender, instance, created, **kwargs):
    """When a new message is created, notify the other participant in the conversation."""
    if not created:
        return

    # Skip system messages — they are not user-initiated
    if instance.is_system_message:
        return

    conversation = instance.conversation
    sender_user = instance.sender

    # Determine the recipient (the other party in the conversation)
    if sender_user == conversation.client:
        recipient = conversation.contractor
    elif sender_user == conversation.contractor:
        recipient = conversation.client
    else:
        # Unexpected sender (e.g. admin), skip notification
        return

    project = conversation.project
    notify(
        user=recipient,
        title=f"New Message from {sender_user.username}",
        message=f"{sender_user.username} sent you a message about \"{project.title}\".",
        type="CHAT",
        link=f"/messages?conversation={conversation.id}",
    )
