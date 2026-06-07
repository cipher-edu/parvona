from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    ReferralStatsView,
    FirebaseAuthView,
    TelegramAuthView,
    EmailOTPSendView,
    EmailOTPVerifyView,
    RegisterOTPSendView,
    RegisterOTPVerifyView,
    RegisterTelegramInitView,
    RegisterTelegramVerifyView,
    TelegramOTPLoginInitView,
    TelegramOTPLoginVerifyView,
    TelegramConnectionView,
    AdminUserListView,
    AdminUserDetailView,
    AdminSuspendUserView,
)

app_name = 'users'

urlpatterns = [
    # Auth
    path('register/',          RegisterView.as_view(),      name='register'),
    path('login/',             LoginView.as_view(),         name='login'),
    path('logout/',            LogoutView.as_view(),        name='logout'),
    path('firebase/',          FirebaseAuthView.as_view(),    name='firebase-auth'),
    path('telegram/',          TelegramAuthView.as_view(),    name='telegram-auth'),
    path('email-otp/send/',        EmailOTPSendView.as_view(),       name='email-otp-send'),
    path('email-otp/verify/',      EmailOTPVerifyView.as_view(),     name='email-otp-verify'),
    path('register/send-otp/',        RegisterOTPSendView.as_view(),         name='register-otp-send'),
    path('register/verify-otp/',      RegisterOTPVerifyView.as_view(),       name='register-otp-verify'),
    path('register/telegram/init/',   RegisterTelegramInitView.as_view(),    name='register-telegram-init'),
    path('register/telegram/verify/', RegisterTelegramVerifyView.as_view(),  name='register-telegram-verify'),
    path('telegram/otp/init/',        TelegramOTPLoginInitView.as_view(),    name='telegram-otp-login-init'),
    path('telegram/otp/verify/',      TelegramOTPLoginVerifyView.as_view(),  name='telegram-otp-login-verify'),
    path('telegram/connect/',         TelegramConnectionView.as_view(),      name='telegram-connect-fallback'),
    path('token/refresh/',     TokenRefreshView.as_view(),  name='token-refresh'),
    # Profil
    path('me/',                MeView.as_view(),            name='me'),
    path('me/password/',       ChangePasswordView.as_view(), name='change-password'),
    path('me/referral/',       ReferralStatsView.as_view(),  name='referral-stats'),
    path('me/telegram/connect/', TelegramConnectionView.as_view(), name='me-telegram-connect'),
    # Admin
    path('admin/users/',                AdminUserListView.as_view(),   name='admin-users'),
    path('admin/users/<uuid:id>/',      AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<uuid:id>/suspend/', AdminSuspendUserView.as_view(), name='admin-suspend'),
]
