from django.urls import path
from .views import (
    NannyListView,
    NannyDetailView,
    MyNannyProfileView,
    NannyAvailabilityView,
    NannyAvailabilityPublicView,
    AdminNannyListView,
    AdminVerifyNannyView,
)

app_name = 'nannies'

urlpatterns = [
    path('',                              NannyListView.as_view(),              name='list'),
    path('me/',                           MyNannyProfileView.as_view(),         name='my-profile'),
    path('me/availability/',              NannyAvailabilityView.as_view(),      name='my-availability'),
    path('<uuid:id>/',                    NannyDetailView.as_view(),            name='detail'),
    path('<uuid:id>/availability/',       NannyAvailabilityPublicView.as_view(), name='availability'),

    # Admin
    path('admin/',                        AdminNannyListView.as_view(),         name='admin-list'),
    path('admin/<uuid:id>/verify/',       AdminVerifyNannyView.as_view(),       name='admin-verify'),
]
