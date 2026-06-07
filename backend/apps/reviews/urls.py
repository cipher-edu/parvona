from django.urls import path
from .views import (
    ReviewListCreateView,
    MyReviewsView,
    LatestReviewsView,
    PendingReviewsView,
    ReceivedReviewsView,
    NannyReviewListView,
)

app_name = 'reviews'

urlpatterns = [
    path('',          ReviewListCreateView.as_view(), name='list-create'),
    path('my/',       MyReviewsView.as_view(),        name='my-reviews'),
    path('received/', ReceivedReviewsView.as_view(),  name='received'),
    path('pending/',  PendingReviewsView.as_view(),   name='pending'),
    path('latest/',   LatestReviewsView.as_view(),    name='latest'),
]
