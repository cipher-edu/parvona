from django.contrib import admin
from .models import SupportConversation, SupportMessage


class SupportMessageInline(admin.TabularInline):
    model  = SupportMessage
    extra  = 0
    fields = ['sender', 'text', 'read_at', 'created_at']
    readonly_fields = ['created_at', 'read_at']


@admin.register(SupportConversation)
class SupportConversationAdmin(admin.ModelAdmin):
    list_display   = ['user', 'admin', 'subject', 'status', 'created_at']
    list_filter    = ['status']
    search_fields  = ['user__name', 'user__email', 'subject']
    inlines        = [SupportMessageInline]


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display  = ['sender', 'conversation', 'text', 'created_at']
    search_fields = ['sender__name', 'text']
