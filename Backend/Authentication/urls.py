from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    RoleBasedTokenObtainPairView, 
    ContractorLicenseUploadView,
    AdminLicenseListView,
    AdminLicenseReviewView
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", RoleBasedTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("contractor/license/upload/", ContractorLicenseUploadView.as_view(), name="contractor_license_upload"),
    path("contractor/upload-license/", ContractorLicenseUploadView.as_view(), name="contractor_upload_license"),
    
    # Admin URLs
    path("admin/licenses/", AdminLicenseListView.as_view(), name="admin_license_list"),
    path("admin/licenses/<int:pk>/review/", AdminLicenseReviewView.as_view(), name="admin_license_review"),
]
