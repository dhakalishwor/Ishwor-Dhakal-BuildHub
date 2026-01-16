from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Rating
from .serializers import RatingCreateSerializer, RatingListSerializer

User = get_user_model()

class RatingCreateView(generics.CreateAPIView):
    serializer_class = RatingCreateSerializer
    permission_classes = [IsAuthenticated]


class MyContractorRatingsView(generics.ListAPIView):
    serializer_class = RatingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Rating.objects.filter(contractor=self.request.user).order_by("-created_at")


class ContractorRatingsView(generics.ListAPIView):
    serializer_class = RatingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        contractor = get_object_or_404(User, id=self.kwargs["contractor_id"])
        return Rating.objects.filter(contractor=contractor).order_by("-created_at")
