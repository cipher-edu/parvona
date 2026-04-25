from django.contrib import admin
from django.utils.html import format_html
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = (
        'short_id', 'parent_name', 'nanny_name',
        'status_badge', 'total_amount_fmt',
        'start_date', 'end_date', 'created_at',
    )
    list_filter   = ('status', 'start_date')
    search_fields = ('parent__name', 'parent__email', 'nanny__name', 'address')
    ordering      = ('-created_at',)
    readonly_fields = (
        'id', 'hourly_rate', 'total_amount',
        'confirmed_at', 'started_at', 'completed_at', 'cancelled_at',
        'created_at', 'updated_at',
    )
    raw_id_fields = ('parent', 'nanny')

    fieldsets = (
        ('Asosiy', {
            'fields': ('id', 'parent', 'nanny', 'status')
        }),
        ('Vaqt', {
            'fields': ('start_date', 'end_date', 'hours_per_day')
        }),
        ('To\'lov', {
            'fields': ('hourly_rate', 'total_amount')
        }),
        ('Qo\'shimcha', {
            'fields': ('address', 'notes', 'cancel_reason')
        }),
        ('Timestamplar', {
            'fields': ('confirmed_at', 'started_at', 'completed_at', 'cancelled_at', 'created_at', 'updated_at')
        }),
    )

    STATUS_COLORS = {
        'pending':   '#f59e0b',
        'confirmed': '#3b82f6',
        'active':    '#10b981',
        'completed': '#6b7280',
        'cancelled': '#ef4444',
        'disputed':  '#dc2626',
        'resolved':  '#8b5cf6',
    }

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parent', 'nanny')

    def short_id(self, obj):
        return str(obj.id)[:8]
    short_id.short_description = 'ID'

    def parent_name(self, obj):
        return obj.parent.name
    parent_name.short_description = 'Ota-ona'

    def nanny_name(self, obj):
        return obj.nanny.name
    nanny_name.short_description = 'Enaga'

    def status_badge(self, obj):
        color = self.STATUS_COLORS.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Holat'

    def total_amount_fmt(self, obj):
        return f"{obj.total_amount:,} so'm"
    total_amount_fmt.short_description = 'Jami'
