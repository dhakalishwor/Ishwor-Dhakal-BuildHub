from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Bid
from .serializers import BidCreateSerializer, BidListSerializer, BidStatusUpdateSerializer
from .permission import IsContractor, IsClient
from RecommendationSystem.models import Project


class BidCreateView(generics.CreateAPIView):
    serializer_class = BidCreateSerializer
    permission_classes = [IsAuthenticated, IsContractor]

    def perform_create(self, serializer):
        serializer.save(contractor=self.request.user)


class MyBidsView(generics.ListAPIView):
    serializer_class = BidListSerializer
    permission_classes = [IsAuthenticated, IsContractor]

    def get_queryset(self):
        return Bid.objects.filter(contractor=self.request.user).order_by("-created_at")


class ProjectBidsView(generics.ListAPIView):
    serializer_class = BidListSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def get_queryset(self):
        project_id = self.kwargs["project_id"]
        project = get_object_or_404(Project, id=project_id)

        if project.client_id != self.request.user.id:
            return Bid.objects.none()

        return Bid.objects.filter(project=project).order_by("-created_at")


class UpdateBidStatusView(generics.UpdateAPIView):
    serializer_class = BidStatusUpdateSerializer
    permission_classes = [IsAuthenticated, IsClient]
    queryset = Bid.objects.all()

    def update(self, request, *args, **kwargs):
        bid = self.get_object()
        project = bid.project

        if project.client_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        if project.status != "BIDDING":
            return Response({"detail": "Bidding is closed for this project."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(bid, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        if new_status == "ACCEPTED":
            Bid.objects.filter(project=project).exclude(id=bid.id).update(status="REJECTED")
            bid.status = "ACCEPTED"
            bid.save()

            if hasattr(project, "assigned_contractor"):
                project.assigned_contractor = bid.contractor

            project.status = "ACTIVE"
            project.save()

        elif new_status == "REJECTED":
            bid.status = "REJECTED"
            bid.save()

        return Response({"detail": f"Bid {bid.id} updated to {bid.status}."}, status=status.HTTP_200_OK)
