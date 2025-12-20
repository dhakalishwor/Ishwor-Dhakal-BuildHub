from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, RoleBasedTokenObtainPairView, ContractorLicenseUploadView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", RoleBasedTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    
    path("contractor/upload-license/", ContractorLicenseUploadView.as_view(), name="contractor_upload_license"),
]
