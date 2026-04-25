from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentStatusView,
    ProSubscriptionView,
    PaymeWebhookView,
    ClickWebhookView,
    AdminPaymentListView,
)

app_name = 'payments'

urlpatterns = [
    path('initiate/',                    InitiatePaymentView.as_view(),  name='initiate'),
    path('status/<uuid:booking_id>/',    PaymentStatusView.as_view(),    name='status'),
    path('pro/',                         ProSubscriptionView.as_view(),  name='pro'),
    path('webhook/payme/',               PaymeWebhookView.as_view(),     name='webhook-payme'),
    path('webhook/click/',               ClickWebhookView.as_view(),     name='webhook-click'),

    # Admin
    path('admin/',                       AdminPaymentListView.as_view(), name='admin-list'),
]
