from django.apps import AppConfig


class ChatSystemConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ChatSystem"

    def ready(self):
        import ChatSystem.signals  # noqa: F401 — registers post_save signal for Message
