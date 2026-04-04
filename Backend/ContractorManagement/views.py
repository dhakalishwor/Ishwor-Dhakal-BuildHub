from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Contractor, WorkerProfile
from .serializers import ContractorSerializer, WorkerProfileSerializer
from .permissions import IsContractorOwner
from ProgressTracking.models import ProjectAssignment
from RecommendationSystem.models import Project as GeneralProject

User = get_user_model()


class ContractorViewSet(viewsets.ModelViewSet):
    queryset = Contractor.objects.all()
    serializer_class = ContractorSerializer
    permission_classes = [IsAuthenticated, IsContractorOwner]
    lookup_field = "user_id"
    parser_classes = [JSONParser, MultiPartParser, FormParser]

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
                    serializer = ContractorSerializer(contractor, context={"request": request})
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
                context={"request": request},
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = WorkerProfile.objects.all()
    serializer_class = WorkerProfileSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get", "put", "patch"], url_path="me")
    def me(self, request):
        user = request.user
        if user.role != "worker":
            return Response({"detail": "Only worker users can access this endpoint."}, status=403)
        
        profile, _ = WorkerProfile.objects.get_or_create(
            user=user,
            defaults={"full_name": user.username, "skills": "", "phone": ""}
        )
        
        if request.method == "GET":
            return Response(WorkerProfileSerializer(profile, context={"request": request}).data)
        
        serializer = WorkerProfileSerializer(
            profile, 
            data=request.data, 
            partial=(request.method == "PATCH"),
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="hire", parser_classes=[JSONParser, MultiPartParser, FormParser])
    def hire(self, request, pk=None):
        worker_profile = self.get_object()
        contractor = request.user
        
        if contractor.role != "contractor":
            return Response({"detail": "Only contractors can hire workers."}, status=403)
            
        project_id = request.data.get("project_id")
        hiring_type = request.data.get("hiring_type") # PER_DAY or PER_PROJECT
        rate = request.data.get("rate")
        
        if not all([project_id, hiring_type, rate]):
            return Response({"detail": "Missing project_id, hiring_type, or rate."}, status=400)
            
        project = get_object_or_404(GeneralProject, id=project_id, assigned_contractor=contractor)
        
        if project.status != "ACTIVE":
            return Response(
                {"detail": "You can only hire workers for projects that are currently ACTIVE."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Check if worker already has an ACTIVE assignment on ANY project
        active_assignment = ProjectAssignment.objects.filter(
            worker=worker_profile.user, status="ACTIVE"
        ).select_related("project").first()
        
        if active_assignment:
            if active_assignment.project_id == project.id:
                return Response(
                    {"detail": "This worker is already assigned to this project."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": f"This worker already has an active assignment on \"{active_assignment.project.title}\". They must complete or be terminated from that project first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        assignment = ProjectAssignment.objects.create(
            project=project,
            contractor=contractor,
            worker=worker_profile.user,
            hiring_type=hiring_type,
            rate=rate,
            status="ACTIVE"
        )
        
        return Response({"detail": f"Worker {worker_profile.full_name} hired for {project.title}."}, status=201)
