from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            (getattr(request.user, "role", "") or "").lower() == "admin"
        )
