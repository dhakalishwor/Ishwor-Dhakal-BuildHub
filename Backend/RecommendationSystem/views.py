from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectSerializer

from ContractorManagement.models import Contractor
from ContractorManagement.serializers import ContractorSerializer


class ProjectViewSet(ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(client=self.request.user).order_by("-created_at")

    def _get_recommended_contractors(self, project: Project):
        category_label = dict(Project.CATEGORY_CHOICES).get(project.category)
        if not category_label:
            return Contractor.objects.none(), ""

        contractors = Contractor.objects.filter(
            project_types__contains=[category_label]
        ).order_by("-experience_years")

        return contractors, category_label

    def perform_create(self, serializer):
        project = serializer.save(client=self.request.user)

        contractors, category_label = self._get_recommended_contractors(project)

        # store for create() response
        self._recommended_contractors = contractors
        self._category_label = category_label

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        contractors = getattr(self, "_recommended_contractors", Contractor.objects.none())
        category_label = getattr(self, "_category_label", "")

        response.data["categoryLabel"] = category_label
        response.data["recommended_contractors"] = ContractorSerializer(contractors, many=True).data

        return response

    @action(detail=True, methods=["get"], url_path="recommend-contractors")
    def recommend_contractors(self, request, pk=None):
        project = self.get_object()

        contractors, category_label = self._get_recommended_contractors(project)

        return Response(
            {
                "projectId": project.id,
                "category": project.category,
                "categoryLabel": category_label,
                "recommended": ContractorSerializer(contractors, many=True).data,
            }
        )
