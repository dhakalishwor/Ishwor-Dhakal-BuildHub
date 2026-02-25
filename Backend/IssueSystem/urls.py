from django.urls import path
from .views import (
    CreateReportView,
    MyReportsView,
    AdminReportsListView,
    AdminReportUpdateView,
    ReportDetailView,
)

urlpatterns = [
    path("reports/create/", CreateReportView.as_view(), name="report-create"),
    path("reports/me/", MyReportsView.as_view(), name="my-reports"),
    path("reports/<int:pk>/", ReportDetailView.as_view(), name="report-detail"),
    path("admin/reports/", AdminReportsListView.as_view(), name="admin-reports-list"),
    path(
        "admin/reports/<int:pk>/",
        AdminReportUpdateView.as_view(),
        name="admin-report-update",
    ),
]
