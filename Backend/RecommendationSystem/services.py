from ContractorManagement.models import Contractor
from .models import Project


def recommend_contractors_for_project(project: Project):
    cat_code = str(project.category).strip().lower()
    cat_label = str(dict(Project.CATEGORY_CHOICES).get(project.category, "")).strip().lower()
    
    wanted = {cat_code, cat_label}
    matched = []

    all_contractors = Contractor.objects.all()
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

        if any(w in normalized_types for w in wanted):
            matched.append(contractor)

    matched.sort(
        key=lambda c: int(getattr(c, "experience_years", 0) or 0),
        reverse=True
    )

    return matched
