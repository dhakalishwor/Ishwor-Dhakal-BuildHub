from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .admin_serializers import AdminClientSerializer
from .permissions import IsAdminRole
from rest_framework.permissions import IsAuthenticated

User = get_user_model()

class AdminClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for administrators to manage clients.
    """
    serializer_class = AdminClientSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = User.objects.filter(role=User.ROLE_CLIENT).order_by("-date_joined")

    def perform_create(self, serializer):
        serializer.save(role=User.ROLE_CLIENT)
