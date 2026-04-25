from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

admin.site.site_header  = 'Parvona Admin'
admin.site.site_title   = 'Parvona'
admin.site.index_title  = 'Boshqaruv paneli'

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # OpenAPI Docs
    path('api/schema/',     SpectacularAPIView.as_view(),    name='schema'),
    path('api/docs/',       SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/',      SpectacularRedocView.as_view(url_name='schema'),   name='redoc'),

    # API v1
    path('api/auth/',           include('apps.users.urls',         namespace='users')),
    path('api/nannies/',        include('apps.nannies.urls',        namespace='nannies')),
    path('api/bookings/',       include('apps.bookings.urls',       namespace='bookings')),
    path('api/reviews/',        include('apps.reviews.urls',        namespace='reviews')),
    path('api/payments/',       include('apps.payments.urls',       namespace='payments')),
    path('api/chat/',           include('apps.chat.urls',           namespace='chat')),
    path('api/notifications/',  include('apps.notifications.urls',  namespace='notifications')),
    path('api/support/',        include('apps.support.urls',        namespace='support')),
]

# Nanny detail da reviews uchun
from apps.reviews.views import NannyReviewListView  # noqa
urlpatterns += [
    path('api/nannies/<uuid:nanny_id>/reviews/', NannyReviewListView.as_view(), name='nanny-reviews'),
]

# ─── Centralized Admin API (/api/admin/*) ─────────────────────────────────────
from apps.users.views import (  # noqa
    AdminUserListView, AdminUserDetailView,
    AdminActivateUserView, AdminDeactivateUserView,
    AdminStatsView,
)
from apps.nannies.views import (  # noqa
    AdminNannyListView, AdminVerifyNannyPostView, AdminUnverifyNannyView,
)
from apps.bookings.views import (  # noqa
    AdminBookingListView, AdminResolveDisputeView, AdminRecentBookingsView,
)
from apps.payments.views import AdminPaymentListView, AdminPaymentStatsView  # noqa

urlpatterns += [
    # Stats
    path('api/admin/stats/',                              AdminStatsView.as_view()),

    # Users
    path('api/admin/users/',                              AdminUserListView.as_view()),
    path('api/admin/users/<uuid:id>/',                    AdminUserDetailView.as_view()),
    path('api/admin/users/<uuid:id>/activate/',           AdminActivateUserView.as_view()),
    path('api/admin/users/<uuid:id>/deactivate/',         AdminDeactivateUserView.as_view()),

    # Nannies
    path('api/admin/nannies/',                            AdminNannyListView.as_view()),
    path('api/admin/nannies/<uuid:id>/verify/',           AdminVerifyNannyPostView.as_view()),
    path('api/admin/nannies/<uuid:id>/unverify/',         AdminUnverifyNannyView.as_view()),

    # Bookings (recent must come before <uuid:id>)
    path('api/admin/bookings/recent/',                    AdminRecentBookingsView.as_view()),
    path('api/admin/bookings/',                           AdminBookingListView.as_view()),
    path('api/admin/bookings/<uuid:id>/resolve/',         AdminResolveDisputeView.as_view()),

    # Payments (stats must come before potential <uuid:id> patterns)
    path('api/admin/payments/stats/',                     AdminPaymentStatsView.as_view()),
    path('api/admin/payments/',                           AdminPaymentListView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    try:
        import debug_toolbar
        urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass
