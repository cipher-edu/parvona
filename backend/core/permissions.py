from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsParent(BasePermission):
    message = "Faqat ota-onalar uchun ruxsat berilgan."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'parent'
        )


class IsNanny(BasePermission):
    message = "Faqat enagalar uchun ruxsat berilgan."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'nanny'
        )


class IsAdminRole(BasePermission):
    message = "Faqat adminlar uchun ruxsat berilgan."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Obyektning egasi yoki admin o'zgartira oladi.
    Obyektda `user` field bo'lishi kerak.
    """
    message = "Faqat egasi yoki admin."

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        owner = getattr(obj, 'user', getattr(obj, 'author', None))
        return owner == request.user


class IsOwnerOrReadOnly(BasePermission):
    """O'qish hammaga, yozish faqat egasiga."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, 'user', getattr(obj, 'author', None))
        return owner == request.user
