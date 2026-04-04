from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
import re
import pytesseract
from .models import ContractorLicense, ClientProfile
from .permissions import IsAdminRole
from .serializers import (
    RegisterSerializer,
    RoleBasedTokenObtainPairSerializer,
    ContractorLicenseUploadSerializer,
    AdminClientSerializer,
    ClientProfileSerializer,
    AdminContractorLicenseSerializer,
)
from verification.utils import verify_contractor_documents

User = get_user_model()



class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Allow unauthenticated access

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        is_contractor = (user.role == User.ROLE_CONTRACTOR)

        headers = self.get_success_headers(serializer.data)

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
                "next": "/contractor/upload-license/" if is_contractor else "/login/",
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class RoleBasedTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleBasedTokenObtainPairSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Allow unauthenticated access


class ContractorLicenseUploadView(generics.CreateAPIView):
    """
    Contractor uploads license and citizenship document after registration (no login required).
    Frontend must send contractor_id + license_document + citizenship_document.

    If uploaded again → overwrite/update.
    Includes OCR verification after upload.
    """
    serializer_class = ContractorLicenseUploadSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Allow unauthenticated access (for initial upload after registration)
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

        license_obj, _ = ContractorLicense.objects.update_or_create(
            contractor=contractor,
            defaults={
                "license_document": serializer.validated_data["license_document"],
                "citizenship_document": serializer.validated_data["citizenship_document"],
            },
        )

        file_path = license_obj.license_document.path
        poppler_path = getattr(settings, "POPPLER_PATH", None)

        first_name = getattr(contractor, "first_name", "").strip()
        last_name = getattr(contractor, "last_name", "").strip()

        if first_name and last_name:
            registered_name = f"{first_name} {last_name}"
        elif first_name:
            registered_name = first_name
        else:
            username = getattr(contractor, "username", "").strip()
            if "_" in username or "-" in username:
                parts = re.split(r"[_\-]", username)
                if len(parts) >= 2:
                    registered_name = " ".join(p.capitalize() for p in parts[:2])
                else:
                    registered_name = username
            else:
                registered_name = username

        try:
            # We need the absolute paths of both documents
            file_paths = [
                license_obj.license_document.path,
                license_obj.citizenship_document.path
            ]
            
            print(f"Starting verification for contractor {contractor_id}")
            result = verify_contractor_documents(file_paths)
            print(f"Verification result: {result.get('message')}")

            license_obj.match_score = result.get("confidence_score", 0)
            best_match = result.get("best_match", ("", ""))
            license_obj.extracted_name = f"{best_match[0]}, {best_match[1]}" if best_match[0] else ""

            if result.get("verified"):
                license_obj.status = ContractorLicense.STATUS_VERIFIED
                license_obj.rejection_reason = ""
                license_obj.save()
                return Response(
                    {
                        "message": "Documents verified successfully. You can now login.",
                        "status": license_obj.status,
                        "redirect": "/login",
                        "details": result
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                license_obj.status = ContractorLicense.STATUS_REJECTED
                license_obj.rejection_reason = result.get("message", "Verification failed.")
                license_obj.save()
                return Response(
                    {
                        "error": result.get("message"),
                        "status": license_obj.status,
                        "details": result
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            print(f"Unexpected error in verification: {e}")
            license_obj.status = ContractorLicense.STATUS_UNDER_REVIEW
            license_obj.rejection_reason = f"Verification system error: {str(e)}"
            license_obj.save()
            return Response(
                {"error": f"An error occurred during verification: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class ContractorLicenseUpdateView(APIView):
    """
    Authenticated contractor can update/re-upload their license and citizenship document.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user

        if getattr(user, "role", None) != User.ROLE_CONTRACTOR:
            return Response(
                {"detail": "Only contractors can upload licenses."},
                status=status.HTTP_403_FORBIDDEN
            )

        license_obj, _ = ContractorLicense.objects.get_or_create(contractor=user)

        serializer = ContractorLicenseUploadSerializer(
            instance=license_obj,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        file_path = license_obj.license_document.path
        poppler_path = getattr(settings, "POPPLER_PATH", None)

        first_name = getattr(user, "first_name", "").strip()
        last_name = getattr(user, "last_name", "").strip()

        if first_name and last_name:
            registered_name = f"{first_name} {last_name}"
        elif first_name:
            registered_name = first_name
        else:
            username = getattr(user, "username", "").strip()
            if "_" in username or "-" in username:
                parts = re.split(r"[_\-]", username)
                if len(parts) >= 2:
                    registered_name = " ".join(p.capitalize() for p in parts[:2])
                else:
                    registered_name = username
            else:
                registered_name = username

        try:
            result_status, score, extracted_or_reason = verify_contractor_license(
                file_path=file_path,
                registered_name=registered_name,
                threshold=90.0,
                poppler_path=poppler_path
            )

            license_obj.match_score = score

            if result_status == "VERIFIED":
                license_obj.status = ContractorLicense.STATUS_VERIFIED
                license_obj.extracted_name = extracted_or_reason
                license_obj.rejection_reason = ""
            elif result_status == "UNDER_REVIEW":
                license_obj.status = ContractorLicense.STATUS_UNDER_REVIEW
                license_obj.extracted_name = extracted_or_reason if score > 0 else ""
                license_obj.rejection_reason = (
                    extracted_or_reason if score == 0 else "Low confidence / partial mismatch."
                )
            else:
                license_obj.status = ContractorLicense.STATUS_REJECTED
                license_obj.extracted_name = extracted_or_reason
                license_obj.rejection_reason = "Name on license does not match registration details."
        except pytesseract.TesseractNotFoundError:
            license_obj.status = ContractorLicense.STATUS_UNDER_REVIEW
            license_obj.match_score = None
            license_obj.extracted_name = ""
            license_obj.rejection_reason = "OCR verification unavailable. Document requires manual review."
        except Exception as e:
            license_obj.status = ContractorLicense.STATUS_UNDER_REVIEW
            license_obj.match_score = None
            license_obj.extracted_name = ""
            license_obj.rejection_reason = f"OCR verification failed: {str(e)}. Document requires manual review."

        license_obj.save()

        return Response(
            {
                "status": license_obj.status,
                "registered_name": registered_name,
                "extracted_name": license_obj.extracted_name,
                "match_score": license_obj.match_score,
                "rejection_reason": license_obj.rejection_reason,
            },
            status=status.HTTP_200_OK
        )


class AdminLicenseListView(generics.ListAPIView):
    """
    Admin can see all uploaded licenses.
    """
    queryset = ContractorLicense.objects.all().order_by("-updated_at")
    serializer_class = AdminContractorLicenseSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]


class AdminLicenseReviewView(APIView):
    """
    Admin can approve or reject a license.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        license_obj = get_object_or_404(ContractorLicense, pk=pk)
        new_status = request.data.get("status")
        reason = request.data.get("rejection_reason", "")

        if new_status not in [ContractorLicense.STATUS_VERIFIED, ContractorLicense.STATUS_REJECTED]:
            return Response(
                {"detail": "Invalid status. Must be VERIFIED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        license_obj.status = new_status
        if new_status == ContractorLicense.STATUS_REJECTED:
            license_obj.rejection_reason = reason
        else:
            license_obj.rejection_reason = ""

        license_obj.save()
        return Response({"detail": f"License marked as {new_status}."})


class AdminClientListCreateView(generics.ListCreateAPIView):
    """Admin can list all client users or create a new client."""
    serializer_class = AdminClientSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role=User.ROLE_CLIENT).order_by('-date_joined')


class AdminClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin can view, update, or delete a client user."""
    serializer_class = AdminClientSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role=User.ROLE_CLIENT)


class ClientProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientProfileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ClientProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        profile, created = ClientProfile.objects.get_or_create(
            user=request.user,
            defaults={'full_name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username}
        )
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)