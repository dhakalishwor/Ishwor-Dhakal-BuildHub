# CostEstimation/urls.py
from django.urls import path
from .views import CostEstimatePreviewView

urlpatterns = [
    path("estimate/preview/", CostEstimatePreviewView.as_view()),
]
