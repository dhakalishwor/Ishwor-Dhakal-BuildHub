from django.urls import path
from .views import ContractorVerificationAPIView

urlpatterns = [
    path(
        "verify-contractor/",
        ContractorVerificationAPIView.as_view(),
        name="verify_contractor"
    ),
]