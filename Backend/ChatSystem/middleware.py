from django.db import close_old_connections
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None

class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        # Get token from query string
        query_string = parse_qs(scope["query_string"].decode("utf8"))
        token_list = query_string.get("token")
        
        if not token_list:
            scope["user"] = None
        else:
            token = token_list[0]
            try:
                # Validate token
                UntypedToken(token)
                decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_data.get("user_id")
                scope["user"] = await get_user(user_id)
            except (InvalidToken, TokenError, Exception):
                scope["user"] = None

        return await super().__call__(scope, receive, send)

def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)
