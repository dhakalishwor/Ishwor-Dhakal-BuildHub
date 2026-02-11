from rest_framework import permissions

class IsContractorOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a profile to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Safe methods are allowed for all authenticated users to view profiles
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user.is_authenticated and (getattr(request.user, "role", "") or "").lower() == "admin":
            return True

        return obj.user == request.user
