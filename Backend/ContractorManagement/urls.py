from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContractorViewSet, WorkerViewSet

router = DefaultRouter()
router.register(r"contractors", ContractorViewSet, basename="contractors")
router.register(r"workers", WorkerViewSet, basename="workers")

urlpatterns = [
    path("", include(router.urls)),
]
