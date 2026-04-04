from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminRole
from django.contrib.auth import get_user_model
from .models import ClientProfile, ContractorLicense
from ContractorManagement.models import Contractor
from RecommendationSystem.models import Project
from IssueSystem.models import Report

User = get_user_model()

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        total_contractors = Contractor.objects.count()
        total_clients = User.objects.filter(role=User.ROLE_CLIENT).count()
        pending_licenses = ContractorLicense.objects.filter(status=ContractorLicense.STATUS_UNDER_REVIEW).count()
        open_reports = Report.objects.filter(status='OPEN').count()
        active_projects = Project.objects.filter(status='ACTIVE').count()
        
        # Recent activity (e.g., last 5 users)
        recent_users = User.objects.order_by('-date_joined')[:5]
        
        recent_users_data = []
        for u in recent_users:
            profile_pic = None
            if u.role == User.ROLE_CLIENT:
                try:
                    profile_pic = request.build_absolute_uri(u.client_profile.profile_picture.url) if u.client_profile.profile_picture else None
                except ClientProfile.DoesNotExist:
                    pass
            elif u.role == User.ROLE_CONTRACTOR:
                try:
                    profile_pic = request.build_absolute_uri(u.contractor_profile.profile_picture.url) if u.contractor_profile.profile_picture else None
                except Exception: # Contractor might not have profile yet
                    pass
            
            recent_users_data.append({
                "id": u.id,
                "username": u.username,
                "role": u.role,
                "date_joined": u.date_joined,
                "profile_picture": profile_pic
            })

        return Response({
            "stats": {
                "totalContractors": total_contractors,
                "totalClients": total_clients,
                "pendingLicenses": pending_licenses,
                "openReports": open_reports,
                "activeProjects": active_projects,
            },
            "recentUsers": recent_users_data
        })
