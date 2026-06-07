from django.urls import path
from .views import (
    NannyListView,
    NannyDetailView,
    MyNannyProfileView,
    NannyAvailabilityView,
    NannyAvailabilityPublicView,
    AdminNannyListView,
    AdminVerifyNannyView,
    NannyDocumentListCreateView,
)
from apps.reviews.views import NannyReviewListView

app_name = 'nannies'

urlpatterns = [
    path('',                              NannyListView.as_view(),               name='list'),
    path('me/',                           MyNannyProfileView.as_view(),          name='my-profile'),
    path('me/availability/',              NannyAvailabilityView.as_view(),       name='my-availability'),
    path('me/documents/',                 NannyDocumentListCreateView.as_view(), name='my-documents'),
    path('<uuid:id>/',                    NannyDetailView.as_view(),             name='detail'),
    path('<uuid:id>/availability/',       NannyAvailabilityPublicView.as_view(), name='availability'),
    path('<uuid:nanny_id>/reviews/',      NannyReviewListView.as_view(),         name='nanny-reviews'),
    # Admin
    path('admin/',                        AdminNannyListView.as_view(),          name='admin-list'),
    path('admin/<uuid:id>/verify/',       AdminVerifyNannyView.as_view(),        name='admin-verify'),
]
