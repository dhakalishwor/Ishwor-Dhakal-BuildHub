from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkLogViewSet, MilestoneViewSet, 
    ProjectAssignmentViewSet, SubJobApplicationViewSet,
    TaskViewSet, ProjectProgressUpdateViewSet
)

router = DefaultRouter()
router.register(r'work-logs', WorkLogViewSet)
router.register(r'milestones', MilestoneViewSet)
router.register(r'assignments', ProjectAssignmentViewSet)
router.register(r'sub-job-applications', SubJobApplicationViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'progress-updates', ProjectProgressUpdateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
