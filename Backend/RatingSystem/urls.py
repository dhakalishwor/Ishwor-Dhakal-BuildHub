from django.urls import path
from .views import RatingCreateView, MyContractorRatingsView, ContractorRatingsView

urlpatterns = [
    path("ratings/", RatingCreateView.as_view(), name="rating-create"),
    path("ratings/me/", MyContractorRatingsView.as_view(), name="my-ratings"),
    path("contractors/<int:contractor_id>/ratings/", ContractorRatingsView.as_view(), name="contractor-ratings"),
]
