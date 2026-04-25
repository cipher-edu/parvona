from django.contrib import admin
from django.utils.html import format_html
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model           = Message
    fields          = ('sender', 'text', 'read_at', 'created_at')
    readonly_fields = ('sender', 'text', 'read_at', 'created_at')
    extra           = 0
    can_delete      = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display    = ('short_id', 'booking_str', 'message_count', 'created_at')
    readonly_fields = ('id', 'booking', 'created_at', 'updated_at')
    search_fields   = ('booking__parent__name', 'booking__nanny__name')
    ordering        = ('-created_at',)
    inlines         = [MessageInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('booking')

    def short_id(self, obj):
        return str(obj.id)[:8]
    short_id.short_description = 'ID'

    def booking_str(self, obj):
        return str(obj.booking)[:50]
    booking_str.short_description = 'Buyurtma'

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Xabarlar soni'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display    = ('short_id', 'sender_name', 'conversation_link', 'short_text', 'is_read_badge', 'created_at')
    list_filter     = ('created_at',)
    search_fields   = ('sender__name', 'sender__email', 'text')
    ordering        = ('-created_at',)
    readonly_fields = ('id', 'conversation', 'sender', 'text', 'read_at', 'created_at', 'updated_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('sender', 'conversation')

    def short_id(self, obj):
        return str(obj.id)[:8]
    short_id.short_description = 'ID'

    def sender_name(self, obj):
        return obj.sender.name
    sender_name.short_description = 'Yuboruvchi'

    def conversation_link(self, obj):
        return format_html(
            '<a href="/admin/chat/conversation/{}/change/">{}</a>',
            obj.conversation.id, str(obj.conversation)[:40]
        )
    conversation_link.short_description = 'Suhbat'

    def short_text(self, obj):
        return obj.text[:80] + '...' if len(obj.text) > 80 else obj.text
    short_text.short_description = 'Xabar'

    def is_read_badge(self, obj):
        if obj.read_at:
            return format_html('<span style="color:#10b981">✓ O\'qildi</span>')
        return format_html('<span style="color:#f59e0b">● O\'qilmadi</span>')
    is_read_badge.short_description = 'Holat'
