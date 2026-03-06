from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Bid
from .serializers import BidCreateSerializer, BidListSerializer, BidStatusUpdateSerializer
from .permission import IsContractor, IsClient
from RecommendationSystem.models import Project
from NotificationSystem.utils import notify


class BidCreateView(generics.CreateAPIView):
    serializer_class = BidCreateSerializer
    permission_classes = [IsAuthenticated, IsContractor]

    def perform_create(self, serializer):
        bid = serializer.save(contractor=self.request.user)
        project = bid.project
        contractor = self.request.user

        # Notify client that a new bid was placed on their project
        notify(
            user=project.client,
            title="New Bid Received",
            message=f"{contractor.username} placed a bid of Rs {bid.proposed_price} on your project \"{project.title}\".",
            type="BID",
            link=f"/clientdashboard?menu=project-bids&project={project.id}",
        )


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

            # Notify winning contractor their bid was accepted
            notify(
                user=bid.contractor,
                title="Bid Accepted 🎉",
                message=f"Your bid on \"{project.title}\" has been accepted! You are now the assigned contractor.",
                type="BID",
                link="/contractor?menu=bids",
            )

        elif new_status == "REJECTED":
            bid.status = "REJECTED"
            bid.save()

            # Notify contractor their bid was rejected
            notify(
                user=bid.contractor,
                title="Bid Rejected",
                message=f"Your bid on \"{project.title}\" was not accepted by the client.",
                type="BID",
                link=f"/contractor?menu=projects&project={project.id}",
            )

        return Response({"detail": f"Bid {bid.id} updated to {bid.status}."}, status=status.HTTP_200_OK)


class WithdrawBidView(generics.UpdateAPIView):
    """Contractor withdraws their own bid → notifies client."""
    permission_classes = [IsAuthenticated, IsContractor]
    queryset = Bid.objects.all()

    def update(self, request, *args, **kwargs):
        bid = get_object_or_404(Bid, pk=kwargs["pk"], contractor=request.user)

        if bid.status != "PENDING":
            return Response(
                {"detail": "Only a PENDING bid can be withdrawn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bid.status = "WITHDRAWN"
        bid.save(update_fields=["status"])

        project = bid.project

        # Notify client that the contractor withdrew their bid
        notify(
            user=project.client,
            title="Bid Withdrawn",
            message=f"{request.user.username} has withdrawn their bid on \"{project.title}\".",
            type="BID",
            link=f"/clientdashboard?menu=project-bids&project={project.id}",
        )

        return Response({"detail": "Bid withdrawn successfully."}, status=status.HTTP_200_OK)
