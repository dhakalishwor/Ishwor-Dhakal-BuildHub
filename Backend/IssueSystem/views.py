from django.db import models
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Report
from .serializers import (
    ReportCreateSerializer,
    ReportListSerializer,
    AdminReportUpdateSerializer,
)
from .permissions import IsAdmin


class CreateReportView(generics.CreateAPIView):
    serializer_class = ReportCreateSerializer
    permission_classes = [IsAuthenticated]


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
