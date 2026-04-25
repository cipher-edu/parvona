from django.urls import path
from .views import ConversationListView, ConversationView, MessageListView, MessageCreateView

app_name = 'chat'

urlpatterns = [
    # Suhbatlar ro'yxati
    path('',                              ConversationListView.as_view(), name='conversation-list'),
    # Bitta suhbat (booking_id orqali)
    path('<uuid:booking_id>/',            ConversationView.as_view(),     name='conversation'),
    # Xabarlar ro'yxati + yuborish
    path('<uuid:booking_id>/messages/',   MessageListView.as_view(),      name='message-list'),
    path('<uuid:booking_id>/send/',       MessageCreateView.as_view(),    name='message-create'),
]
