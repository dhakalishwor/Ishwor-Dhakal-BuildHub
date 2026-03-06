from rest_framework import viewsets, permissions, status, serializers
from django.db import models
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WorkLog, Milestone, ProjectAssignment, SubJobApplication, Task, TaskUpdate, ProjectProgressUpdate
from .serializers import (
    WorkLogSerializer, MilestoneSerializer, 
    ProjectAssignmentSerializer, SubJobApplicationSerializer,
    TaskSerializer, TaskUpdateSerializer, ProjectProgressUpdateSerializer
)
from django.utils import timezone
from NotificationSystem.utils import notify

class WorkLogViewSet(viewsets.ModelViewSet):
    queryset = WorkLog.objects.all()
    serializer_class = WorkLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # base queryset according to role
        if user.role == 'admin':
            qs = WorkLog.objects.all()
        elif user.role == 'worker':
            # Logs created by me or logs for projects I'm assigned to
            qs = WorkLog.objects.filter(worker=user)
        elif user.role == 'client':
            qs = WorkLog.objects.filter(project__client=user)
        elif user.role == 'contractor':
            # As a contractor, I want to see logs for workers I hired
            qs = WorkLog.objects.filter(project__assigned_contractor=user)
        else:
            return WorkLog.objects.none()

        # allow filtering by worker via query param (contractors or admins)
        worker_id = self.request.query_params.get('worker')
        if worker_id:
            try:
                qs = qs.filter(worker_id=int(worker_id))
            except ValueError:
                pass
        return qs

    def perform_create(self, serializer):
        serializer.save(worker=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role == 'worker' and instance.worker == request.user and instance.status == 'APPROVED':
            return Response({"detail": "Cannot modify an approved log."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role == 'worker' and instance.worker == request.user and instance.status == 'APPROVED':
            return Response({"detail": "Cannot modify an approved log."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        work_log = self.get_object()
        # clients and admins always allowed
        if request.user.role in ['client', 'admin']:
            pass
        # contractors may approve logs for projects they manage
        elif request.user.role == 'contractor':
            if work_log.project.assigned_contractor != request.user:
                return Response({"detail": "Not authorized to approve this log."}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"detail": "Not authorized to approve."}, status=status.HTTP_403_FORBIDDEN)
        
        work_log.status = 'APPROVED'
        work_log.save()
        return Response(WorkLogSerializer(work_log).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        work_log = self.get_object()
        if request.user.role in ['client', 'admin']:
            pass
        elif request.user.role == 'contractor':
            if work_log.project.assigned_contractor != request.user:
                return Response({"detail": "Not authorized to reject this log."}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"detail": "Not authorized to reject."}, status=status.HTTP_403_FORBIDDEN)
        
        work_log.status = 'REJECTED'
        work_log.save()
        return Response(WorkLogSerializer(work_log).data)

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Milestone.objects.all()
        elif user.role == 'client':
            return Milestone.objects.filter(project__client=user)
        elif user.role == 'worker':
            # Milestones for projects I'm assigned to (via ProjectAssignment)
            assigned_projects = ProjectAssignment.objects.filter(worker=user, status="ACTIVE").values_list('project_id', flat=True)
            return Milestone.objects.filter(models.Q(project__assigned_contractor=user) | models.Q(project_id__in=assigned_projects))
        elif user.role == 'contractor':
            return Milestone.objects.filter(project__assigned_contractor=user)
        return Milestone.objects.none()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        milestone = self.get_object()
        # Only worker (assigned contractor) or admin can mark as completed?
        # Typically worker marks as completed, client approves.
        milestone.status = 'COMPLETED'
        milestone.completed_at = timezone.now()
        milestone.save()
        return Response(MilestoneSerializer(milestone).data)


class ProjectAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAssignment.objects.all()
    serializer_class = ProjectAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ProjectAssignment.objects.all()
        elif user.role == 'contractor':
            return ProjectAssignment.objects.filter(contractor=user)
        elif user.role == 'worker':
            return ProjectAssignment.objects.filter(worker=user)
        return ProjectAssignment.objects.none()

    def perform_create(self, serializer):
        serializer.save(contractor=self.request.user)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_assignment(self, request, pk=None):
        assignment = self.get_object()
        # only contractor who owns this assignment (or admin) can mark complete
        if request.user != assignment.contractor and request.user.role != 'admin':
            return Response({"detail": "Not authorized."}, status=403)
        assignment.status = 'COMPLETED'
        assignment.completed_at = timezone.now()
        assignment.save()
        return Response(ProjectAssignmentSerializer(assignment).data)

    @action(detail=True, methods=['post'], url_path='terminate')
    def terminate_assignment(self, request, pk=None):
        assignment = self.get_object()
        if request.user != assignment.contractor and request.user.role != 'admin':
            return Response({"detail": "Not authorized."}, status=403)
        assignment.status = 'TERMINATED'
        assignment.save()
        return Response(ProjectAssignmentSerializer(assignment).data)


class SubJobApplicationViewSet(viewsets.ModelViewSet):
    queryset = SubJobApplication.objects.all()
    serializer_class = SubJobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return SubJobApplication.objects.all()
        elif user.role == 'worker':
            return SubJobApplication.objects.filter(worker=user)
        elif user.role == 'contractor':
            # Applications for projects where I am the assigned contractor
            return SubJobApplication.objects.filter(project__assigned_contractor=user)
        return SubJobApplication.objects.none()

    def perform_create(self, serializer):
        serializer.save(worker=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        application = self.get_object()
        if request.user.role != 'contractor' or application.project.assigned_contractor != request.user:
            return Response({"detail": "Not authorized."}, status=403)
        
        application.status = 'ACCEPTED'
        application.save()
        
        # Create ProjectAssignment automatically
        ProjectAssignment.objects.create(
            project=application.project,
            contractor=request.user,
            worker=application.worker,
            hiring_type=application.project.hiring_model,
            rate=application.project.daily_rate or application.project.budget,
            status="ACTIVE"
        )
        
        return Response({"detail": "Application accepted and worker hired."}, status=200)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        if request.user.role != 'contractor' or application.project.assigned_contractor != request.user:
            return Response({"detail": "Not authorized."}, status=403)
        
        application.status = 'REJECTED'
        application.save()
        return Response({"detail": "Application rejected."}, status=200)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Task.objects.all()
        elif user.role == 'contractor':
            return Task.objects.filter(contractor=user)
        elif user.role == 'worker':
            return Task.objects.filter(assigned_to=user)
        return Task.objects.none()

    def perform_create(self, serializer):
        assigned_to = serializer.validated_data.get('assigned_to')
        project = serializer.validated_data.get('project')
        
        # Ensure the worker is actively assigned to the project
        if assigned_to and project:
            assignment = ProjectAssignment.objects.filter(
                worker=assigned_to,
                project=project,
                status='ACTIVE'
            ).first()
            if not assignment:
                # Return validation error as response with 400
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Worker must be actively assigned to the project.")
        
        task = serializer.save(contractor=self.request.user)

        # Notify the assigned worker
        if task.assigned_to:
            notify(
                user=task.assigned_to,
                title="Task Assigned",
                message=f"You have been assigned a new task: {task.task_name}",
                type="SYSTEM",
                link="/worker/dashboard?menu=mytasks"
            )

    @action(detail=True, methods=['post'], url_path='submit-update')
    def submit_update(self, request, pk=None):
        task = self.get_object()
        if request.user != task.assigned_to and request.user.role != 'admin':
            return Response({"detail": "Only the assigned worker can submit updates."}, status=403)
        
        # Ensure the worker still has an ACTIVE assignment for this project
        if request.user.role == 'worker':
            assignment = ProjectAssignment.objects.filter(
                worker=request.user,
                project=task.project,
                status='ACTIVE'
            ).first()
            if not assignment:
                return Response({"detail": "You must have an active assignment to submit updates."}, status=403)
        
        description = request.data.get('description')
        photo = request.FILES.get('photo')
        
        if not description:
            return Response({"detail": "Description is required."}, status=400)
            
        update = TaskUpdate.objects.create(
            task=task,
            worker=request.user,
            description=description,
            photo=photo
        )
        
        # Update task status to COMPLETED if worker says so? Or just keep in progress?
        # Let's say if it was REWORK, it goes back to IN_PROGRESS or COMPLETED
        if task.status == 'REWORK':
            task.status = 'IN_PROGRESS'
            task.save()
            
        return Response(TaskUpdateSerializer(update).data, status=201)

    @action(detail=True, methods=['post'], url_path='request-rework')
    def request_rework(self, request, pk=None):
        task = self.get_object()
        if request.user != task.contractor and request.user.role != 'admin':
            return Response({"detail": "Only the managing contractor can request rework."}, status=403)
            
        comments = request.data.get('comments')
        task.status = 'REWORK'
        task.comments = comments
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='accept')
    def contractor_accept(self, request, pk=None):
        # contractor can mark task approved (i.e. accept completed work)
        task = self.get_object()
        if request.user != task.contractor and request.user.role != 'admin':
            return Response({"detail": "Only the managing contractor can accept tasks."}, status=403)
            
        # Only allow accept if worker has submitted at least one update
        if not task.updates.exists():
            return Response({"detail": "Cannot accept task before worker submits progress update."}, status=400)

        task.status = 'APPROVED'
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='decline')
    def contractor_reject(self, request, pk=None):
        # contractor rejects completed work -> set to REWORK
        task = self.get_object()
        if request.user != task.contractor and request.user.role != 'admin':
            return Response({"detail": "Only the managing contractor can reject tasks."}, status=403)
            
        # Only allow reject/rework if worker has submitted at least one update
        if not task.updates.exists():
            return Response({"detail": "Cannot request rework before worker submits progress update."}, status=400)

        task.status = 'REWORK'
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='worker-accept')
    def worker_accept(self, request, pk=None):
        task = self.get_object()
        if request.user != task.assigned_to and request.user.role != 'admin':
            return Response({"detail": "Only the assigned worker can accept this task."}, status=403)
        if task.status != 'PENDING':
            return Response({"detail": "Task is not pending."}, status=400)
        task.status = 'IN_PROGRESS'
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='worker-reject')
    def worker_reject(self, request, pk=None):
        task = self.get_object()
        if request.user != task.assigned_to and request.user.role != 'admin':
            return Response({"detail": "Only the assigned worker can reject this task."}, status=403)
        if task.status != 'PENDING':
            return Response({"detail": "Task is not pending."}, status=400)
        task.status = 'REJECTED'
        task.assigned_to = None
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='submit-update')
    def submit_update(self, request, pk=None):
        task = self.get_object()
        if request.user != task.assigned_to and request.user.role != 'admin':
            return Response({"detail": "Only the assigned worker can submit updates."}, status=403)
        
        # Ensure the worker still has an ACTIVE assignment for this project
        if request.user.role == 'worker':
            assignment = ProjectAssignment.objects.filter(
                worker=request.user,
                project=task.project,
                status='ACTIVE'
            ).first()
            if not assignment:
                return Response({"detail": "You must have an active assignment to submit updates."}, status=403)
        
        description = request.data.get('description')
        photo = request.FILES.get('photo')
        
        if not description:
            return Response({"detail": "Description is required."}, status=400)
            
        update = TaskUpdate.objects.create(
            task=task,
            worker=request.user,
            description=description,
            photo=photo
        )
        
        # Update task status to COMPLETED if worker says so? Or just keep in progress?
        # Let's say if it was REWORK, it goes back to IN_PROGRESS or COMPLETED
        if task.status == 'REWORK':
            task.status = 'IN_PROGRESS'
            task.save()
            
        return Response(TaskUpdateSerializer(update).data, status=201)

    @action(detail=True, methods=['post'], url_path='request-rework')
    def request_rework(self, request, pk=None):
        task = self.get_object()
        if request.user != task.contractor and request.user.role != 'admin':
            return Response({"detail": "Only the managing contractor can request rework."}, status=403)
            
        comments = request.data.get('comments')
        task.status = 'REWORK'
        task.comments = comments
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        task = self.get_object()
        if request.user != task.contractor and request.user.role != 'admin':
            return Response({"detail": "Only the managing contractor can approve tasks."}, status=403)
            
        # Only allow approval if worker has submitted at least one update
        if not task.updates.exists():
            return Response({"detail": "Cannot approve task before worker submits progress update."}, status=400)

        task.status = 'APPROVED'
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """Allow contractor to update task status with optional comments"""
        task = self.get_object()
        if request.user != task.contractor and request.user.role != 'admin':
            return Response({"detail": "Only the managing contractor can update task status."}, status=403)
            
        new_status = request.data.get('status')
        comments = request.data.get('comments', '')
        
        if not new_status:
            return Response({"detail": "Status is required."}, status=400)
        
        # Validate status is one of the allowed choices
        valid_statuses = [choice[0] for choice in Task.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"detail": f"Invalid status. Valid statuses are: {valid_statuses}"}, status=400)
        
        # Update status and comments
        task.status = new_status
        if comments:
            task.comments = comments
        task.save()
        
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['get'], url_path='review')
    def review(self, request, pk=None):
        """Allow contractor to review task details and updates"""
        task = self.get_object()
        if request.user != task.contractor and request.user.role != 'admin':
            return Response({"detail": "Only the managing contractor can review this task."}, status=403)
        
        # Get all updates for this task
        updates = task.updates.all()
        
        serializer = TaskSerializer(task)
        updates_serializer = TaskUpdateSerializer(updates, many=True)
        
        return Response({
            'task': serializer.data,
            'updates': updates_serializer.data,
            'available_actions': self._get_available_actions(task)
        })

    def _get_available_actions(self, task):
        """Return available actions based on current task status"""
        actions = []
        
        if task.status in ['PENDING', 'IN_PROGRESS']:
            actions.extend(['update_status', 'request_rework'])
        elif task.status == 'COMPLETED':
            actions.extend(['approve', 'request_rework'])
        elif task.status == 'REWORK':
            actions.extend(['approve', 'update_status'])
        elif task.status == 'APPROVED':
            actions.append('update_status')
        
        return actions

class ProjectProgressUpdateViewSet(viewsets.ModelViewSet):
    queryset = ProjectProgressUpdate.objects.all()
    serializer_class = ProjectProgressUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ProjectProgressUpdate.objects.all()
        elif user.role == 'client':
            return ProjectProgressUpdate.objects.filter(project__client=user)
        elif user.role == 'contractor':
            return ProjectProgressUpdate.objects.filter(project__assigned_contractor=user)
        elif user.role == 'worker':
             # Updates I posted or for projects I'm assigned to
             assigned_projects = ProjectAssignment.objects.filter(worker=user).values_list('project_id', flat=True)
             return ProjectProgressUpdate.objects.filter(models.Q(posted_by=user) | models.Q(project_id__in=assigned_projects))
        return ProjectProgressUpdate.objects.none()

    def perform_create(self, serializer):
        # Allow Contractor or Assigned Worker to post
        project = serializer.validated_data.get('project')
        milestone = serializer.validated_data.get('milestone', None)
        user = self.request.user
        
        is_contractor = project.assigned_contractor == user
        is_assigned_worker = ProjectAssignment.objects.filter(project=project, worker=user, status='ACTIVE').exists()
        
        if not (is_contractor or is_assigned_worker or user.role == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must have an active assignment to post progress updates.")
        if milestone and milestone.project_id != project.id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Provided milestone does not belong to the project.")

        update = serializer.save(posted_by=user)

        # Notify the project client about the new progress update
        if project.client and project.client != user:
            notify(
                user=project.client,
                title="Progress Update Submitted",
                message=f"{user.username} submitted a progress update on \"{project.title}\".",
                type="PROGRESS",
                link=f"/clientdashboard?menu=monitoring&project={project.id}",
            )

        # If posted by a worker, also notify the assigned contractor
        if user.role == 'worker' and project.assigned_contractor and project.assigned_contractor != user:
            notify(
                user=project.assigned_contractor,
                title="Worker Progress Update",
                message=f"{user.username} submitted a progress update on \"{project.title}\".",
                type="PROGRESS",
                link=f"/contractor?menu=manage-team&project={project.id}",
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        update = self.get_object()
        if request.user != update.project.client and request.user.role != 'admin':
            return Response({"detail": "Only the client can approve progress updates."}, status=403)
            
        update.status = 'APPROVED'
        update.save()
        # If update is linked to a milestone, mark milestone as completed
        try:
            if update.milestone:
                m = update.milestone
                m.status = 'COMPLETED'
                m.completed_at = timezone.now()
                m.save()
        except Exception:
            pass

        # Notify the worker/contractor who posted the update
        notify(
            user=update.posted_by,
            title="Progress Update Approved ✅",
            message=f"Your progress update on \"{update.project.title}\" has been approved by the client.",
            type="PROGRESS",
            link="",
        )
        return Response(ProjectProgressUpdateSerializer(update).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        update = self.get_object()
        if request.user != update.project.client and request.user.role != 'admin':
            return Response({"detail": "Only the client can reject progress updates."}, status=403)
            
        reason = request.data.get('rejection_reason')
        update.status = 'REJECTED'
        update.rejection_reason = reason
        update.save()

        # Notify the worker/contractor who posted the update
        notify(
            user=update.posted_by,
            title="Progress Update Rejected",
            message=f"Your progress update on \"{update.project.title}\" was rejected. Reason: {reason or 'No reason provided'}.",
            type="PROGRESS",
            link="",
        )
        return Response(ProjectProgressUpdateSerializer(update).data)
