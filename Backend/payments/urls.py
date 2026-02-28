from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentVerifyView,
    PaymentFailureView,
    WorkerPaymentsView,
)

urlpatterns = [
    path("payments/initiate/<int:project_id>/", InitiatePaymentView.as_view()),
    path("payments/verify/", PaymentVerifyView.as_view()),  
    path("payments/failure/", PaymentFailureView.as_view()),
    path("payments/worker/", WorkerPaymentsView.as_view()),
]
