from django.contrib import admin
from django.utils.html import format_html
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ('author_name', 'target_name', 'rating_stars', 'short_text', 'created_at')
    list_filter   = ('rating',)
    search_fields = ('author__name', 'target__name', 'text')
    ordering      = ('-created_at',)
    readonly_fields = ('id', 'booking', 'author', 'target', 'created_at', 'updated_at')

    def has_change_permission(self, request, obj=None):
        return False  # Sharhlarni o'zgartirish mumkin emas

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('author', 'target')

    def author_name(self, obj):
        return obj.author.name
    author_name.short_description = 'Muallif'

    def target_name(self, obj):
        return obj.target.name
    target_name.short_description = 'Kim haqida'

    def rating_stars(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<span style="color:#f59e0b">{}</span>', stars)
    rating_stars.short_description = 'Baho'

    def short_text(self, obj):
        return obj.text[:80] + '...' if len(obj.text) > 80 else obj.text
    short_text.short_description = 'Sharh'
