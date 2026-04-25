from django.urls import path
from .views import ReviewCreateView, MyReviewsView, LatestReviewsView, PendingReviewsView, ReceivedReviewsView

app_name = 'reviews'

urlpatterns = [
    path('',         ReviewCreateView.as_view(),   name='create'),
    path('my/',      MyReviewsView.as_view(),       name='my-reviews'),
    path('pending/', PendingReviewsView.as_view(),  name='pending'),
    path('received/',ReceivedReviewsView.as_view(), name='received'),
    path('latest/',  LatestReviewsView.as_view(),   name='latest'),
]
