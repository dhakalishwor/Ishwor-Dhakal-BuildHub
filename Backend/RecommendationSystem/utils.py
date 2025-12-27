from .models import Project

def category_code_to_label(code: str) -> str:
    mapping = dict(Project.CATEGORY_CHOICES)
    return mapping.get(code, "")
