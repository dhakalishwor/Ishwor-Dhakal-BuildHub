from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import models

from .models import Project
from .serializers import ProjectSerializer
from .permissions import IsProjectOwner

from ContractorManagement.models import Contractor
from ContractorManagement.serializers import ContractorSerializer


User = get_user_model()


class ProjectViewSet(ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]

    def get_queryset(self):
        user = self.request.user
        role = (getattr(user, "role", "") or "").upper()

        if role == "CLIENT":
            return Project.objects.filter(client=user).order_by("-created_at")

        if role == "CONTRACTOR":
            return Project.objects.filter(
                models.Q(status="BIDDING") | models.Q(assigned_contractor=user)
            ).distinct().order_by("-created_at")

        return Project.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        role = (getattr(user, "role", "") or "").upper()
        if role != "CLIENT":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only clients can post projects.")

        from .services import recommend_contractors_for_project
        project = serializer.save(client=user)
        self._recommended_contractors = recommend_contractors_for_project(project)
        self._category_label = dict(Project.CATEGORY_CHOICES).get(project.category, "")

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        contractors = getattr(self, "_recommended_contractors", [])
        category_label = getattr(self, "_category_label", "")

        response.data["categoryLabel"] = category_label
        serialized_contractors = ContractorSerializer(contractors, many=True).data
        response.data["recommended"] = serialized_contractors
        response.data["recommended_contractors"] = serialized_contractors
        return response

    @action(detail=True, methods=["get"], url_path="recommend-contractors")
    def recommend_contractors(self, request, pk=None):
        from .services import recommend_contractors_for_project
        project = self.get_object()
        contractors = recommend_contractors_for_project(project)
        category_label = dict(Project.CATEGORY_CHOICES).get(project.category, project.category)

        serialized_contractors = ContractorSerializer(contractors, many=True).data
        return Response(
            {
                "projectId": project.id,
                "category": project.category,
                "categoryLabel": category_label,
                "recommended": serialized_contractors,
                "recommended_contractors": serialized_contractors,
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"], url_path="complete")
    def complete_project(self, request, pk=None):
        project = self.get_object()
        role = (getattr(request.user, "role", "") or "").upper()

        if role != "CLIENT":
            return Response({"detail": "Only clients can complete projects."}, status=status.HTTP_403_FORBIDDEN)

        if project.client_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        if project.status != "ACTIVE":
            return Response({"detail": "Only ACTIVE projects can be completed."}, status=status.HTTP_400_BAD_REQUEST)

        if project.assigned_contractor_id is None:
            return Response({"detail": "No contractor assigned to this project."}, status=status.HTTP_400_BAD_REQUEST)

        project.status = "COMPLETED"
        project.save(update_fields=["status"])

        return Response({"detail": "Project marked as completed."}, status=status.HTTP_200_OK)
