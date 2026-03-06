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
from ProgressTracking.models import ProjectAssignment, WorkLog
from BiddingSystem.models import Bid
from NotificationSystem.utils import notify


User = get_user_model()


class ProjectViewSet(ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]

    def get_queryset(self):
        user = self.request.user
        role = (getattr(user, "role", "") or "").upper()

        if role == "CLIENT":
            return Project.objects.filter(client=user).order_by("-created_at")

        if role in ["CONTRACTOR", "WORKER"]:
            discovery = self.request.query_params.get('discovery') == 'true'
            if role == "WORKER" and discovery:
                # show only active projects that the worker has not yet bid on or logged work for
                bid_projects = Bid.objects.filter(contractor=user).values_list('project_id', flat=True)
                log_projects = WorkLog.objects.filter(worker=user).values_list('project_id', flat=True)
                return Project.objects.filter(status="ACTIVE").exclude(id__in=bid_projects).exclude(id__in=log_projects).order_by("-created_at")

            assigned_projects = ProjectAssignment.objects.filter(worker=user).values_list('project_id', flat=True)
            return Project.objects.filter(
                models.Q(status="BIDDING") | 
                models.Q(assigned_contractor=user, status="ACTIVE") |
                models.Q(assigned_contractor=user, status="COMPLETED") |
                models.Q(id__in=assigned_projects)
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
        recommended = recommend_contractors_for_project(project)
        self._recommended_contractors = recommended
        self._category_label = dict(Project.CATEGORY_CHOICES).get(project.category, "")

        # Notify each recommended contractor about the new project
        for contractor_profile in recommended:
            contractor_user = getattr(contractor_profile, "user", None)
            if contractor_user:
                notify(
                    user=contractor_user,
                    title="New Project Available",
                    message=f"A new {project.category} project \"{project.title}\" in {project.location} matches your profile.",
                    type="SYSTEM",
                    link=f"/contractor?menu=projects&project={project.id}",
                )

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

        # Notify the assigned contractor that the project has been marked completed
        if project.assigned_contractor:
            notify(
                user=project.assigned_contractor,
                title="Project Completed",
                message=f"The client has marked project \"{project.title}\" as completed. Payment may follow shortly.",
                type="SYSTEM",
                link=f"/contractor?menu=bids&project={project.id}",
            )

        return Response({"detail": "Project marked as completed."}, status=status.HTTP_200_OK)
