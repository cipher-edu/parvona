from django.contrib import admin
from django.utils.html import format_html
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = (
        'short_id', 'booking_link', 'provider_badge',
        'amount_fmt', 'status_badge', 'paid_at', 'created_at',
    )
    list_filter   = ('status', 'provider')
    search_fields = ('booking__parent__name', 'provider_tx_id')
    ordering      = ('-created_at',)
    readonly_fields = (
        'id', 'booking', 'provider_tx_id', 'amount',
        'paid_at', 'failed_at', 'refunded_at',
        'metadata', 'created_at', 'updated_at',
    )

    def has_add_permission(self, request):
        return False

    def short_id(self, obj):
        return str(obj.id)[:8]
    short_id.short_description = 'ID'

    def booking_link(self, obj):
        return format_html(
            '<a href="/admin/bookings/booking/{}/change/">{}</a>',
            obj.booking.id, str(obj.booking)[:40]
        )
    booking_link.short_description = 'Buyurtma'

    def provider_badge(self, obj):
        colors = {'payme': '#00a8e0', 'click': '#f97316', 'uzum': '#8b5cf6'}
        color  = colors.get(obj.provider, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_provider_display()
        )
    provider_badge.short_description = 'Provider'

    def amount_fmt(self, obj):
        return f"{obj.amount // 100:,} so'm"
    amount_fmt.short_description = 'Summa'

    def status_badge(self, obj):
        colors = {
            'pending':   '#f59e0b',
            'paid':      '#10b981',
            'failed':    '#ef4444',
            'refunded':  '#8b5cf6',
            'cancelled': '#6b7280',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Holat'
