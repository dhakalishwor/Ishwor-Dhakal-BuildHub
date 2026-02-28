from rest_framework import serializers
from .models import WorkLog, Milestone, ProjectAssignment, SubJobApplication, Task, TaskUpdate, ProjectProgressUpdate

class WorkLogSerializer(serializers.ModelSerializer):
    worker_username = serializers.ReadOnlyField(source='worker.username')
    
    class Meta:
        model = WorkLog
        fields = [
            'id', 'project', 'worker', 'worker_username', 'date', 
            'hours_worked', 'description', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['worker', 'status', 'created_at', 'updated_at']

    def validate(self, attrs):
        user = self.context['request'].user
        date = attrs.get('date') or (self.instance.date if self.instance else None)
        project = attrs.get('project') or (self.instance.project if self.instance else None)
        if date and project:
            qs = WorkLog.objects.filter(worker=user, project=project, date=date)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("You have already logged work for this project on this date.")
        return attrs

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'title', 'description', 'amount', 
            'status', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'completed_at', 'created_at', 'updated_at']


class ProjectAssignmentSerializer(serializers.ModelSerializer):
    project_title = serializers.ReadOnlyField(source='project.title')
    contractor_username = serializers.ReadOnlyField(source='contractor.username')
    worker_username = serializers.ReadOnlyField(source='worker.username')

    class Meta:
        model = ProjectAssignment
        fields = [
            'id', 'project', 'project_title', 'contractor', 'contractor_username', 
            'worker', 'worker_username', 'hiring_type', 'rate', 'status', 
            'assigned_at', 'completed_at'
        ]
        read_only_fields = ['contractor', 'status', 'assigned_at', 'completed_at']


class SubJobApplicationSerializer(serializers.ModelSerializer):
    project_title = serializers.ReadOnlyField(source='project.title')
    worker_username = serializers.ReadOnlyField(source='worker.username')

    class Meta:
        model = SubJobApplication
        fields = [
            'id', 'project', 'project_title', 'worker', 'worker_username', 
            'message', 'status', 'applied_at'
        ]
        read_only_fields = ['worker', 'status', 'applied_at']

class TaskUpdateSerializer(serializers.ModelSerializer):
    worker_username = serializers.ReadOnlyField(source='worker.username')

    class Meta:
        model = TaskUpdate
        fields = ['id', 'task', 'worker', 'worker_username', 'description', 'photo', 'created_at']
        read_only_fields = ['worker', 'created_at']

class ProjectProgressUpdateSerializer(serializers.ModelSerializer):
    posted_by_username = serializers.ReadOnlyField(source='posted_by.username')
    milestone_title = serializers.ReadOnlyField(source='milestone.title')

    class Meta:
        model = ProjectProgressUpdate
        fields = [
            'id', 'project', 'posted_by', 'posted_by_username', 'description', 
            'photo', 'milestone', 'milestone_title', 'status', 'rejection_reason', 'created_at'
        ]
        read_only_fields = ['posted_by', 'status', 'rejection_reason', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    updates = TaskUpdateSerializer(many=True, read_only=True)
    assigned_to_username = serializers.ReadOnlyField(source='assigned_to.username')
    project_title = serializers.ReadOnlyField(source='project.title')

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_title', 'contractor', 'task_name', 
            'description', 'assigned_to', 'assigned_to_username', 'status', 
            'progress_percentage', 'comments', 'due_date', 'date_updated', 'updates'
        ]
        read_only_fields = ['contractor', 'date_updated', 'updates']
