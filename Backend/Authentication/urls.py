from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, 
    RoleBasedTokenObtainPairView, 
    ContractorLicenseUploadView,
    AdminLicenseListView,
    AdminLicenseReviewView
)
from .admin_views import AdminClientViewSet
from .views_profile import ClientProfileViewSet

router = DefaultRouter()
router.register(r'admin/clients', AdminClientViewSet, basename='admin-clients')
router.register(r'clients', ClientProfileViewSet, basename='clients')

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", RoleBasedTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("contractor/license/upload/", ContractorLicenseUploadView.as_view(), name="contractor_license_upload"),
    path("contractor/upload-license/", ContractorLicenseUploadView.as_view(), name="contractor_upload_license"),
    
    # Admin URLs
    path("admin/licenses/", AdminLicenseListView.as_view(), name="admin_license_list"),
    path("admin/licenses/<int:pk>/review/", AdminLicenseReviewView.as_view(), name="admin_license_review"),
    
    # Include router URLs
    path("", include(router.urls)),
]
