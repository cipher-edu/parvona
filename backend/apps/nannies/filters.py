import django_filters
from .models import NannyProfile


class NannyFilter(django_filters.FilterSet):
    min_rate   = django_filters.NumberFilter(field_name='hourly_rate', lookup_expr='gte')
    max_rate   = django_filters.NumberFilter(field_name='hourly_rate', lookup_expr='lte')
    min_rating = django_filters.NumberFilter(field_name='rating',      lookup_expr='gte')
    min_exp    = django_filters.NumberFilter(field_name='experience',   lookup_expr='gte')
    skill      = django_filters.CharFilter(method='filter_skill')

    class Meta:
        model  = NannyProfile
        fields = ['is_verified', 'status']

    def filter_skill(self, queryset, name, value):
        """JSON array ichida qidiruv: skills__contains=[value]"""
        return queryset.filter(skills__contains=[value])
