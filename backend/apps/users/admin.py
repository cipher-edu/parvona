from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('name', 'email', 'role_badge', 'is_active', 'created_at')
    list_filter   = ('role', 'is_active', 'is_staff')
    search_fields = ('name', 'email', 'phone')
    ordering      = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_login')

    fieldsets = (
        ('Asosiy', {
            'fields': ('id', 'email', 'name', 'phone', 'photo', 'role')
        }),
        ('Xavfsizlik', {
            'fields': ('password',),
            'classes': ('collapse',),
        }),
        ('Ruxsatlar', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Vaqtlar', {
            'fields': ('last_login', 'created_at', 'updated_at')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2'),
        }),
    )

    def role_badge(self, obj):
        colors = {
            'parent': '#3b82f6',
            'nanny':  '#10b981',
            'admin':  '#ef4444',
        }
        color = colors.get(obj.role, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Rol'

    actions = ['activate_users', 'deactivate_users']

    @admin.action(description='Tanlangan foydalanuvchilarni faollashtirish')
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description='Tanlangan foydalanuvchilarni bloklash')
    def deactivate_users(self, request, queryset):
        queryset.exclude(role='admin').update(is_active=False)
