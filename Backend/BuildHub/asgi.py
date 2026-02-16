import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "BuildHub.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from ChatSystem.middleware import JwtAuthMiddlewareStack
from ChatSystem.routing import websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": JwtAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        ),
    }
)
