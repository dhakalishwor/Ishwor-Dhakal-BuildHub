from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from RecommendationSystem.models import Project
from BiddingSystem.models import Bid
from django.db.models import Q

class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(client=user) | Q(contractor=user) | Q(worker=user))

    @action(detail=False, methods=["post"], url_path="start")
    def start_conversation(self, request):
        project_id = request.data.get("project_id")
        contractor_id = request.data.get("contractor_id")

        if not project_id or not contractor_id:
            return Response({"error": "project_id and contractor_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure IDs are integers
        try:
            project_id = int(project_id)
            contractor_id = int(contractor_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid project_id or contractor_id format"}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(Project, id=project_id)
        
        # Security Check: Only the project owner (client) can start a chat
        if project.client != request.user:
            return Response({"error": "Only the project owner can initiate a chat"}, status=status.HTTP_403_FORBIDDEN)

        # Security Check: Contractor must have placed a bid
        has_bid = Bid.objects.filter(project=project, contractor_id=contractor_id).exists()
        if not has_bid:
            return Response({"error": "This contractor has not placed a bid on this project"}, status=status.HTTP_403_FORBIDDEN)

        # Get the contractor user object
        from Authentication.models import User
        contractor = get_object_or_404(User, id=contractor_id)

        # Get or Create Conversation
        conversation, created = Conversation.objects.get_or_create(
            project=project,
            client=request.user,
            contractor=contractor,
            worker=None
        )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="start-worker")
    def start_worker_chat(self, request):
        project_id = request.data.get("project_id")
        worker_id = request.data.get("worker_id")

        if not project_id or not worker_id:
            return Response({"error": "project_id and worker_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project_id = int(project_id)
            worker_id = int(worker_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid project_id or worker_id format"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure the requester is a contractor
        if request.user.role != "contractor":
            return Response({"error": "Only contractors can initiate chat with workers"}, status=status.HTTP_403_FORBIDDEN)

        project = get_object_or_404(Project, id=project_id)
        
        # Ensure the contractor is assigned to this project
        if project.assigned_contractor != request.user:
             return Response({"error": "You are not assigned to this project"}, status=status.HTTP_403_FORBIDDEN)

        # Ensure the worker is hired for this project
        from ProgressTracking.models import ProjectAssignment
        has_assignment = ProjectAssignment.objects.filter(
            project=project,
            contractor=request.user,
            worker_id=worker_id,
            status="ACTIVE"
        ).exists()

        if not has_assignment:
            return Response({"error": "This worker is not assigned to this project or assignment is not active"}, status=status.HTTP_403_FORBIDDEN)

        # Get the worker user object
        from Authentication.models import User
        worker = get_object_or_404(User, id=worker_id)

        # Get or Create Conversation (Contractor-Worker chat has client=None)
        conversation, created = Conversation.objects.get_or_create(
            project=project,
            client=None,
            contractor=request.user,
            worker=worker
        )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
