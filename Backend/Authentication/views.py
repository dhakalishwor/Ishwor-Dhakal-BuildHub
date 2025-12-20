from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import ContractorLicense
from .serializers import (
    RegisterSerializer,
    RoleBasedTokenObtainPairSerializer,
    ContractorLicenseUploadSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        is_contractor = (user.role == User.ROLE_CONTRACTOR)

        return Response(
            {
                "message": "Registration successful.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                },
                
                "requires_license_upload": is_contractor,
                "next": "/contractor/upload-license" if is_contractor else "/login",
            },
            status=status.HTTP_201_CREATED,
        )


class RoleBasedTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleBasedTokenObtainPairSerializer
    permission_classes = [AllowAny]


class ContractorLicenseUploadView(generics.CreateAPIView):
    """
    Contractor uploads ONE license document after registration (no login required).
    Frontend must send contractor_id + license_document.

    If uploaded again → overwrite/update.
    """
    serializer_class = ContractorLicenseUploadSerializer
    permission_classes = [AllowAny]  # ✅ public for your required flow
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        contractor_id = request.data.get("contractor_id")
        if not contractor_id:
            return Response(
                {"detail": "contractor_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            contractor = User.objects.get(id=contractor_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Contractor not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if contractor.role != User.ROLE_CONTRACTOR:
            return Response(
                {"detail": "Only contractor accounts can upload license."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ContractorLicense.objects.update_or_create(
            contractor=contractor,
            defaults={"license_document": serializer.validated_data["license_document"]},
        )

        return Response(
            {"message": "License uploaded successfully."},
            status=status.HTTP_201_CREATED
        )