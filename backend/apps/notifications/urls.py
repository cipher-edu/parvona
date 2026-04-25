from django.urls import path
from .views import (
    NotificationListView,
    NotificationReadView,
    NotificationReadAllView,
    UnreadCountView,
)

app_name = 'notifications'

urlpatterns = [
    path('',                      NotificationListView.as_view(),    name='list'),
    path('unread-count/',         UnreadCountView.as_view(),         name='unread-count'),
    path('read-all/',             NotificationReadAllView.as_view(), name='read-all'),
    path('<uuid:id>/read/',       NotificationReadView.as_view(),    name='read'),
]
