from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentVerifyView,
    PaymentFailureView,
)

urlpatterns = [
    path("payments/initiate/<int:project_id>/", InitiatePaymentView.as_view()),
    path("payments/verify/", PaymentVerifyView.as_view()),   # ✅ REQUIRED
    path("payments/failure/", PaymentFailureView.as_view()),
]
