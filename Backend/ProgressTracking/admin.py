from django.contrib import admin
from .models import (
	WorkLog, Milestone, Task, TaskUpdate, ProjectProgressUpdate,
	ProjectAssignment, SubJobApplication
)


@admin.register(WorkLog)
class WorkLogAdmin(admin.ModelAdmin):
	list_display = ('id', 'project', 'worker', 'date', 'hours_worked', 'status')
	search_fields = ('project__title', 'worker__username')


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
	list_display = ('id', 'project', 'title', 'status', 'completed_at')
	search_fields = ('project__title', 'title')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
	list_display = ('id', 'project', 'task_name', 'contractor', 'assigned_to', 'status')
	search_fields = ('task_name', 'project__title')


@admin.register(TaskUpdate)
class TaskUpdateAdmin(admin.ModelAdmin):
	list_display = ('id', 'task', 'worker', 'created_at')
	readonly_fields = ('created_at',)
	actions = ['clear_photos']

	def clear_photos(self, request, queryset):
		for obj in queryset:
			obj.photo.delete(save=False)
			obj.photo = None
			obj.save()
	clear_photos.short_description = "Clear photos from selected task updates"


@admin.register(ProjectProgressUpdate)
class ProjectProgressUpdateAdmin(admin.ModelAdmin):
	list_display = ('id', 'project', 'milestone', 'posted_by', 'status', 'created_at')
	readonly_fields = ('created_at',)
	actions = ['clear_photos']

	def clear_photos(self, request, queryset):
		for obj in queryset:
			obj.photo.delete(save=False)
			obj.photo = None
			obj.save()
	clear_photos.short_description = "Clear photos from selected progress updates"


@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
	list_display = ('id', 'project', 'contractor', 'worker', 'status')


@admin.register(SubJobApplication)
class SubJobApplicationAdmin(admin.ModelAdmin):
	list_display = ('id', 'project', 'worker', 'status', 'applied_at')
