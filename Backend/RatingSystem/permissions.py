from rest_framework.permissions import BasePermission

class IsClient(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (getattr(request.user, "role", "") or "").upper() == "CLIENT"

class IsContractor(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (getattr(request.user, "role", "") or "").upper() == "CONTRACTOR"
