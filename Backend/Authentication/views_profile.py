from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ClientProfile, User
from .serializers import ClientProfileSerializer

class ClientProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientProfileSerializer

    def get_queryset(self):
        return ClientProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        if request.user.role != User.ROLE_CLIENT:
            return Response({"detail": "Not a client."}, status=status.HTTP_403_FORBIDDEN)

        profile, created = ClientProfile.objects.get_or_create(
            user=request.user,
            defaults={"full_name": request.user.get_full_name() or request.user.username}
        )

        if request.method == "GET":
            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        elif request.method == "PATCH":
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
