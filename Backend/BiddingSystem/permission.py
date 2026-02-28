from rest_framework.permissions import BasePermission

class IsContractor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", None) in ["contractor", "worker"]

class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", None) == "client"
