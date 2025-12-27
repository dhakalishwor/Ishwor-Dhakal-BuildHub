from ContractorManagement.models import Contractor
from .models import Project


def recommend_contractors_for_project(project: Project):
    """
    Rule-based recommendation:
    Match project.category label with contractor.project_types
    """

    category_label = dict(Project.CATEGORY_CHOICES).get(project.category)

    if not category_label:
        return Contractor.objects.none()

    return Contractor.objects.filter(
        project_types__contains=[category_label],
        availability_status="Available",
    ).order_by("-experience_years")
