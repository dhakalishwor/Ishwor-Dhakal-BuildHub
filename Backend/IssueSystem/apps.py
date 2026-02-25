from django.apps import AppConfig

class IssuesystemConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "IssueSystem"

    def ready(self):
        from . import signals  # noqa