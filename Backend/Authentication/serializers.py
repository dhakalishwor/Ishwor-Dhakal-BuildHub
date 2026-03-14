from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import ContractorLicense, ClientProfile

User = get_user_model()

class ClientProfileSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source='full_name')

    class Meta:
        model = ClientProfile
        fields = ('fullName', 'phone', 'address', 'bio')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'first_name', 'last_name')
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        if 'role' in validated_data:
            user.role = validated_data['role']
            user.save()
        return user

class RoleBasedTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # The frontend expects a 'user' object with id, username, email, role, and is_admin
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'is_admin': self.user.is_superuser or self.user.is_staff or self.user.role == 'admin'
        }
        return data

class ContractorLicenseUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractorLicense
        fields = ('license_document',)


class AdminClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password', 'is_active')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data['role'] = 'client'
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
