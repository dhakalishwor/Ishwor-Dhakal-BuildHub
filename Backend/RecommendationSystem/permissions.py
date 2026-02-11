from rest_framework import permissions

class IsProjectOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a project to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_authenticated and (getattr(request.user, "role", "") or "").lower() == "admin":
            return True
        
        return obj.client == request.user
