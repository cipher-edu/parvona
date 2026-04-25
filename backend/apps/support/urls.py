from django.urls import path
from .views import (
    ConversationListCreateView,
    ConversationDetailView,
    MessageListView,
    MessageSendView,
    CloseConversationView,
    ReopenConversationView,
)

app_name = 'support'

urlpatterns = [
    path('',                            ConversationListCreateView.as_view(), name='list-create'),
    path('<uuid:id>/',                  ConversationDetailView.as_view(),     name='detail'),
    path('<uuid:id>/messages/',         MessageListView.as_view(),            name='messages'),
    path('<uuid:id>/send/',             MessageSendView.as_view(),            name='send'),
    path('<uuid:id>/close/',            CloseConversationView.as_view(),      name='close'),
    path('<uuid:id>/reopen/',           ReopenConversationView.as_view(),     name='reopen'),
]
