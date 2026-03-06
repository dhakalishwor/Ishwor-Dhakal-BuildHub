from django.db import models
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Report
from .serializers import (
    ReportCreateSerializer,
    ReportListSerializer,
    AdminReportUpdateSerializer,
)
from .permissions import IsAdmin
from NotificationSystem.utils import notify

User = get_user_model()


class CreateReportView(generics.CreateAPIView):
    serializer_class = ReportCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        report = serializer.save(reporter=self.request.user)

        # Notify all admin/staff users about the new report
        admins = User.objects.filter(is_staff=True)
        for admin in admins:
            notify(
                user=admin,
                title="New Issue Report Submitted",
                message=f"Report #{report.id} '{report.title}' submitted by {self.request.user.username} [{report.report_type}].",
                type="ISSUE",
                link=f"/admin/dashboard?issue={report.id}",
            )


class MyReportsView(generics.ListAPIView):
    serializer_class = ReportListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(reporter=self.request.user).order_by("-created_at")


class AdminReportsListView(generics.ListAPIView):
    serializer_class = ReportListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = Report.objects.all().order_by("-created_at")
        status_q = self.request.query_params.get("status")
        report_type = self.request.query_params.get("type")
        priority = self.request.query_params.get("priority")
        search = self.request.query_params.get("search")

        if status_q and status_q != "ALL":
            qs = qs.filter(status=status_q)
        if report_type:
            qs = qs.filter(report_type=report_type)
        if priority:
            qs = qs.filter(priority=priority)
        if search:
            # Search by ID (Ticket ID), Title, or Reporter Username
            if search.isdigit():
                qs = qs.filter(id=int(search))
            else:
                qs = qs.filter(
                    models.Q(title__icontains=search) | 
                    models.Q(reporter__username__icontains=search)
                )

        return qs


class AdminReportUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Report.objects.all()
    serializer_class = AdminReportUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "patch"]

    def perform_update(self, serializer):
        report = serializer.save()

        # Notify the original reporter about the status change
        notify(
            user=report.reporter,
            title="Your Report Status Updated",
            message=f"Report #{report.id} '{report.title}' is now {report.get_status_display()}.",
            type="ISSUE",
            link=f"/support/my-issues?issue={report.id}",
        )


class ReportDetailView(generics.RetrieveAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only view their own reports unless they are admin
        user = self.request.user
        if user.is_staff: # basic check for admin
            return Report.objects.all()
        return Report.objects.filter(reporter=user)
