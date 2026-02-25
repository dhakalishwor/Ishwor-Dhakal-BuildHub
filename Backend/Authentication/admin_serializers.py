from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class AdminClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "is_active", "date_joined", "password"]
        read_only_fields = ["id", "date_joined", "role"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        # Force role to client
        validated_data["role"] = User.ROLE_CLIENT
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
