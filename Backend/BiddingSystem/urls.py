from django.urls import path
from .views import BidCreateView, MyBidsView, ProjectBidsView, UpdateBidStatusView, WithdrawBidView

urlpatterns = [
    path("bids/create/", BidCreateView.as_view(), name="bid-create"),
    path("my-bids/", MyBidsView.as_view(), name="my-bids"),
    path("bids/me/", MyBidsView.as_view(), name="my-bids-me"),
    path("projects/<int:project_id>/bids/", ProjectBidsView.as_view(), name="project-bids"),
    path("bids/<int:pk>/status/", UpdateBidStatusView.as_view(), name="bid-status-update"),
    path("bids/<int:pk>/withdraw/", WithdrawBidView.as_view(), name="bid-withdraw"),
]
