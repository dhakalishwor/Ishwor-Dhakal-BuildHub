from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    RoleBasedTokenObtainPairView,
    ContractorLicenseUploadView,
    ContractorLicenseUpdateView,
    AdminLicenseListView,
    AdminLicenseReviewView,
    AdminClientListCreateView,
    AdminClientDetailView,
    ClientProfileViewSet,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'clients', ClientProfileViewSet, basename='clients')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', RoleBasedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('contractor/upload-license/', ContractorLicenseUploadView.as_view(), name='contractor_upload_license'),
    path('contractor/update-license/', ContractorLicenseUpdateView.as_view(), name='contractor_update_license'),

    path('admin/licenses/', AdminLicenseListView.as_view(), name='admin_license_list'),
    path('admin/licenses/<int:pk>/review/', AdminLicenseReviewView.as_view(), name='admin_license_review'),

    # Admin client management
    path('admin/clients/', AdminClientListCreateView.as_view(), name='admin_client_list_create'),
    path('admin/clients/<int:pk>/', AdminClientDetailView.as_view(), name='admin_client_detail'),
]
