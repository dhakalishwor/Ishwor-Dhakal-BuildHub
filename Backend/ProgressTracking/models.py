from django.db import models
from django.conf import settings
from ContractorManagement.models import Contractor


class WorkLog(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    project = models.ForeignKey(
        "RecommendationSystem.Project", 
        on_delete=models.CASCADE, 
        related_name="work_logs"
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="work_logs"
    )
    date = models.DateField()
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    payment_status = models.CharField(max_length=15, choices=(('UNPAID', 'Unpaid'), ('PAID', 'Paid')), default="UNPAID")
    transaction_uuid = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # prevent multiple entries for same worker/project/date
        unique_together = (('worker', 'project', 'date'),)

    def __str__(self):
        # Assuming Project has a 'title' attribute, if not, adjust accordingly
        return f"WorkLog({self.project.title if hasattr(self.project, 'title') else self.project.id} - {self.worker.username} - {self.date})"

class Milestone(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("COMPLETED", "Completed"),
        ("PAID", "Paid"),
    )

    project = models.ForeignKey(
        "RecommendationSystem.Project", 
        on_delete=models.CASCADE, 
        related_name="milestones"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Assuming Project has a 'title' attribute, if not, adjust accordingly
        return f"Milestone({self.project.title if hasattr(self.project, 'title') else self.project.id} - {self.title})"

class Task(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('REJECTED', 'Rejected'),
        ('REWORK', 'Rework Required'),
        ('COMPLETED', 'Completed'),
        ('APPROVED', 'Approved')
    ]

    # 'REJECTED' is used when a worker declines an assignment or a contractor refuses the completed work.

    project = models.ForeignKey("RecommendationSystem.Project", on_delete=models.CASCADE, related_name="tasks")
    contractor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="managed_tasks")
    task_name = models.CharField(max_length=200)
    description = models.TextField()
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tasks")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    progress_percentage = models.IntegerField(default=0)  # 0-100
    comments = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    date_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.task_name} ({self.project.title})"

class TaskUpdate(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="updates")
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.TextField()
    photo = models.ImageField(upload_to='task_updates/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Update for {self.task.task_name} by {self.worker.username}"

class ProjectProgressUpdate(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    project = models.ForeignKey("RecommendationSystem.Project", on_delete=models.CASCADE, related_name="progress_updates")
    milestone = models.ForeignKey('Milestone', on_delete=models.SET_NULL, null=True, blank=True, related_name='progress_updates')
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.TextField(help_text="Notes about the progress")
    photo = models.ImageField(upload_to='progress_updates/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Progress for {self.project.title} status: {self.status}"


class ProjectAssignment(models.Model):
    HIRING_TYPE_CHOICES = (
        ("PER_DAY", "Per Day"),
        ("PER_PROJECT", "Per Project"),
    )
    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("TERMINATED", "Terminated"),
    )

    project = models.ForeignKey(
        "RecommendationSystem.Project",
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hired_workers",
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_assignments",
    )
    hiring_type = models.CharField(max_length=20, choices=HIRING_TYPE_CHOICES)
    rate = models.DecimalField(max_digits=12, decimal_places=2, help_text="Agreed rate (total or daily)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.worker.username} assigned to {self.project.title} by {self.contractor.username}"


class SubJobApplication(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    )

    project = models.ForeignKey(
        "RecommendationSystem.Project",
        on_delete=models.CASCADE,
        related_name="sub_job_applications",
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sub_job_applications",
    )
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.worker.username} applied for {self.project.title}"