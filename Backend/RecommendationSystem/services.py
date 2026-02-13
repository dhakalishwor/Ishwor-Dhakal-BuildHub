from ContractorManagement.models import Contractor
from .models import Project


def recommend_contractors_for_project(project: Project):
    category_label = dict(Project.CATEGORY_CHOICES).get(project.category, project.category)

    if not category_label:
        return []

    all_contractors = Contractor.objects.all()
    
    wanted = str(category_label).strip().lower()
    matched = []

    for contractor in all_contractors:
        status = str(getattr(contractor, "availability_status", "") or "").strip().lower()
        if status != "available":
            continue

        types = contractor.project_types or []
        
        normalized_types = []
        if isinstance(types, str):
            normalized_types = [t.strip().lower() for t in types.split(",")]
        elif isinstance(types, list):
            for t in types:
                if isinstance(t, str):
                    normalized_types.extend([x.strip().lower() for x in t.split(",")])
                else:
                    normalized_types.append(str(t).strip().lower())
        else:
            continue

        if wanted in normalized_types:
            matched.append(contractor)

    matched.sort(
        key=lambda c: int(getattr(c, "experience_years", 0) or 0),
        reverse=True
    )

    return matched
