from django.urls import path
from .views import (
    BookingListCreateView,
    BookingDetailView,
    BookingStatusView,
    AdminBookingListView,
    AdminResolveDisputeView,
)

app_name = 'bookings'

urlpatterns = [
    path('',                             BookingListCreateView.as_view(),  name='list-create'),
    path('<uuid:id>/',                   BookingDetailView.as_view(),       name='detail'),
    path('<uuid:id>/status/',            BookingStatusView.as_view(),       name='status'),

    # Admin
    path('admin/',                       AdminBookingListView.as_view(),    name='admin-list'),
    path('admin/<uuid:id>/resolve/',     AdminResolveDisputeView.as_view(), name='admin-resolve'),
]
