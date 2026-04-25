from django.contrib import admin
from django.utils.html import format_html
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ('user_name', 'type', 'title', 'is_read_badge', 'created_at')
    list_filter   = ('type',)
    search_fields = ('user__name', 'title', 'body')
    ordering      = ('-created_at',)
    readonly_fields = ('id', 'user', 'type', 'title', 'body', 'data', 'read_at', 'created_at')

    def has_add_permission(self, request):
        return False

    def user_name(self, obj):
        return obj.user.name
    user_name.short_description = 'Foydalanuvchi'

    def is_read_badge(self, obj):
        if obj.is_read:
            return format_html('<span style="color:#10b981">✓ O\'qildi</span>')
        return format_html('<span style="color:#f59e0b">● Yangi</span>')
    is_read_badge.short_description = 'Holat'
