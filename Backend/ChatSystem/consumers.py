import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"
        self.user = self.scope["user"]

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Check if user is part of this conversation
        if not await self.is_user_in_conversation():
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get("message")

        if not message_content:
            return

        # Save message to DB
        message_obj = await self.save_message(message_content)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_content,
                "sender": self.user.username,
                "sender_id": self.user.id,
                "created_at": message_obj.created_at.isoformat(),
            }
        )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def is_user_in_conversation(self):
        try:
            conv = Conversation.objects.get(id=self.conversation_id)
            return conv.client == self.user or conv.contractor == self.user or conv.worker == self.user
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        conv = Conversation.objects.get(id=self.conversation_id)
        return Message.objects.create(
            conversation=conv,
            sender=self.user,
            content=content
        )
