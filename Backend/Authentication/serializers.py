from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import ContractorLicense

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "password"]

    def validate_role(self, value: str) -> str:
        allowed = {User.ROLE_CLIENT, User.ROLE_CONTRACTOR, User.ROLE_WORKER}
        if value not in allowed:
            raise serializers.ValidationError("Invalid role selected.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ContractorLicenseUploadSerializer(serializers.ModelSerializer):
    """
    Upload serializer should NOT depend on request.user because the upload flow
    is public (AllowAny) in your project (Register → Upload → Login).

    Role validation is done in the View using contractor_id.
    """
    class Meta:
        model = ContractorLicense
        fields = ["license_document"]

    def validate_license_document(self, file):
        if not file:
            raise serializers.ValidationError("License document is required.")
        return file


class RoleBasedTokenObtainPairSerializer(TokenObtainPairSerializer):
    role = serializers.CharField(write_only=True)

    def validate(self, attrs):
        selected_role = (attrs.get("role") or "").strip().lower()
        data = super().validate(attrs)
        user = self.user

        # Admin login
        if selected_role == "admin":
            if not (user.is_staff or user.is_superuser):
                raise serializers.ValidationError("You are not allowed to login as admin.")
        else:
            allowed = {User.ROLE_CLIENT, User.ROLE_CONTRACTOR, User.ROLE_WORKER}
            if selected_role not in allowed:
                raise serializers.ValidationError("Invalid role selected.")
            if user.role != selected_role:
                raise serializers.ValidationError("Selected role does not match your account role.")

            # ✅ Contractor must upload license before login
            if user.role == User.ROLE_CONTRACTOR and not hasattr(user, "contractor_license"):
                raise serializers.ValidationError("Contractor license document not uploaded yet.")

        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_admin": bool(user.is_staff or user.is_superuser),
        }
        return data
