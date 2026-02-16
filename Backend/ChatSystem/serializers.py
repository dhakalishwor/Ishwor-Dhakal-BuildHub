from rest_framework import serializers
from .models import Conversation, Message
from Authentication.models import User
from RecommendationSystem.models import Project

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "role"]

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "title"]

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source="sender.username")

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "sender_name", "content", "is_system_message", "created_at"]
        read_only_fields = ["sender", "created_at"]

class ConversationSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    contractor = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "project", "client", "contractor", "created_at", "last_message"]

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by("-created_at").first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None
