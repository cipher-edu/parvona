from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import NannyProfile


@admin.register(NannyProfile)
class NannyProfileAdmin(admin.ModelAdmin):
    list_display  = (
        'user_name', 'hourly_rate_fmt', 'experience',
        'rating_stars', 'reviews_count', 'status_badge',
        'verified_badge', 'created_at',
    )
    list_filter   = ('status', 'is_verified')
    search_fields = ('user__name', 'user__email', 'location_name')
    ordering      = ('-rating',)
    readonly_fields = (
        'id', 'rating', 'reviews_count',
        'verified_at', 'verified_by', 'created_at', 'updated_at',
    )
    raw_id_fields = ('user',)

    fieldsets = (
        ('Asosiy', {
            'fields': ('id', 'user', 'age', 'experience', 'hourly_rate', 'bio', 'video_url')
        }),
        ('Ko\'nikmalar', {
            'fields': ('skills',)
        }),
        ('Joylashuv', {
            'fields': ('location_name', 'latitude', 'longitude')
        }),
        ('Statistika', {
            'fields': ('rating', 'reviews_count'),
        }),
        ('Holat', {
            'fields': ('status', 'is_verified', 'verified_at', 'verified_by')
        }),
        ('Vaqtlar', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    actions = ['verify_nannies', 'unverify_nannies', 'suspend_nannies', 'activate_nannies']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

    def user_name(self, obj):
        return obj.user.name
    user_name.short_description = 'Ism'

    def hourly_rate_fmt(self, obj):
        return f"{obj.hourly_rate:,} so'm"
    hourly_rate_fmt.short_description = 'Narx/soat'

    def rating_stars(self, obj):
        full  = int(obj.rating)
        stars = '★' * full + '☆' * (5 - full)
        return format_html('<span style="color:#f59e0b">{}</span> {}', stars, obj.rating)
    rating_stars.short_description = 'Reyting'

    def status_badge(self, obj):
        colors = {'active': '#10b981', 'inactive': '#6b7280', 'suspended': '#ef4444'}
        color  = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Holat'

    def verified_badge(self, obj):
        if obj.is_verified:
            return format_html('<span style="color:#10b981;font-weight:bold">✓ Tasdiqlangan</span>')
        return format_html('<span style="color:#ef4444">✗ Tasdiqlanmagan</span>')
    verified_badge.short_description = 'Verifikatsiya'

    @admin.action(description='Tanlangan enagalarni tasdiqlash')
    def verify_nannies(self, request, queryset):
        queryset.update(is_verified=True, verified_at=timezone.now(), verified_by=request.user)

    @admin.action(description='Tasdiqni olib tashlash')
    def unverify_nannies(self, request, queryset):
        queryset.update(is_verified=False, verified_at=None, verified_by=None)

    @admin.action(description='Bloklash')
    def suspend_nannies(self, request, queryset):
        queryset.update(status='suspended')

    @admin.action(description='Faollashtirish')
    def activate_nannies(self, request, queryset):
        queryset.update(status='active')
