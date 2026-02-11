from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import Contractor
from .serializers import ContractorSerializer
from .permissions import IsContractorOwner

User = get_user_model()


class ContractorViewSet(viewsets.ModelViewSet):
    queryset = Contractor.objects.all()
    serializer_class = ContractorSerializer
    permission_classes = [IsAuthenticated, IsContractorOwner]

    @action(detail=False, methods=["get", "put", "patch"], url_path="me")
    def me(self, request):
        try:
            user = request.user

            # Ensure user is a contractor
            if user.role != User.ROLE_CONTRACTOR:
                return Response(
                    {"detail": "Only contractor users can access this endpoint."},
                    status=status.HTTP_403_FORBIDDEN
                )

            try:
                contractor, created = Contractor.objects.get_or_create(
                    user=user,
                    defaults={
                        "full_name": getattr(user, "username", "Contractor"),
                        "email": getattr(user, "email", None),
                        "contractor_type": Contractor.CONTRACTOR_TYPE_INDIVIDUAL,
                        "work_type": "Other",
                        "experience_years": 0,
                        "phone": "",
                        "availability_status": Contractor.AVAILABILITY_AVAILABLE,
                        "rate_type": Contractor.RATE_TYPE_PROJECT,
                        "address": "",
                        "project_types": [],
                    },
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response(
                    {"detail": f"Error creating/retrieving contractor profile: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            if request.method == "GET":
                try:
                    serializer = ContractorSerializer(contractor)
                    return Response(serializer.data)
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    return Response(
                        {"detail": f"Error serializing contractor profile: {str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            # For PUT/PATCH
            serializer = ContractorSerializer(
                contractor,
                data=request.data,
                partial=(request.method == "PATCH"),
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
