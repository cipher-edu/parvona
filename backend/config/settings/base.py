from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-only-key-change-in-prod')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# ─── Apps ────────────────────────────────────────────────────────────────────

DJANGO_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'channels',
    'django_celery_beat',
    'django_celery_results',
]

LOCAL_APPS = [
    'apps.users',
    'apps.nannies',
    'apps.bookings',
    'apps.reviews',
    'apps.payments',
    'apps.chat',
    'apps.notifications',
    'apps.support',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─── Middleware ───────────────────────────────────────────────────────────────

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION  = 'config.asgi.application'

# ─── Database ────────────────────────────────────────────────────────────────

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     config('DB_NAME'),
        'USER':     config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST':     config('DB_HOST', default='localhost'),
        'PORT':     config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {'connect_timeout': 10},
    }
}

AUTH_USER_MODEL = 'users.User'

# ─── Password validation ──────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── Internationalization ─────────────────────────────────────────────────────

LANGUAGE_CODE = 'uz'
TIME_ZONE     = 'Asia/Tashkent'
USE_I18N      = True
USE_TZ        = True

# ─── Static & Media ───────────────────────────────────────────────────────────

STATIC_URL   = '/static/'
STATIC_ROOT  = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL    = '/media/'
MEDIA_ROOT   = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Redis ────────────────────────────────────────────────────────────────────

REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

CACHES = {
    'default': {
        'BACKEND':  'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS':  {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
        'TIMEOUT':  300,
        'KEY_PREFIX': 'parvona',
    }
}

# ─── Celery ───────────────────────────────────────────────────────────────────

CELERY_BROKER_URL         = REDIS_URL
CELERY_RESULT_BACKEND     = 'django-db'
CELERY_CACHE_BACKEND      = 'default'
CELERY_ACCEPT_CONTENT     = ['json']
CELERY_TASK_SERIALIZER    = 'json'
CELERY_RESULT_SERIALIZER  = 'json'
CELERY_TIMEZONE           = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT    = 30 * 60  # 30 daqiqa
# DatabaseScheduler o'chirildi — celery.py dagi beat_schedule ishlashi uchun
# (DatabaseScheduler faqat DB yozuvlarini ko'radi, app.conf.beat_schedule ni emas)

# ─── Channels ─────────────────────────────────────────────────────────────────

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG':  {'hosts': [REDIS_URL]},
    }
}

# ─── DRF ──────────────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': ['core.renderers.UnifiedJSONRenderer'],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',
        'user': '2000/hour',
        'auth': '10/min',
    },
}

# ─── SimpleJWT ────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=14),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN':        True,
    'AUTH_HEADER_TYPES':        ('Bearer',),
    'TOKEN_OBTAIN_SERIALIZER':  'apps.users.serializers.CustomTokenObtainPairSerializer',
}

# ─── CORS ─────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ─── Spectacular (Swagger) ────────────────────────────────────────────────────

SPECTACULAR_SETTINGS = {
    'TITLE':               'Parvona API',
    'DESCRIPTION':         'Enaga topish platformasi — Parvona REST API',
    'VERSION':             '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# ─── Payment providers ────────────────────────────────────────────────────────

PAYME_MERCHANT_ID = config('PAYME_MERCHANT_ID', default='')
PAYME_SECRET_KEY  = config('PAYME_SECRET_KEY',  default='')
CLICK_MERCHANT_ID = config('CLICK_MERCHANT_ID', default='')
CLICK_SERVICE_ID  = config('CLICK_SERVICE_ID',  default='')

# ─── Email (SMTP) ────────────────────────────────────────────────────────────

EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = config('EMAIL_HOST',     default='mail.enagam.uz')
EMAIL_PORT          = config('EMAIL_PORT',     default=587, cast=int)
EMAIL_USE_TLS       = config('EMAIL_USE_TLS',  default=True, cast=bool)
EMAIL_HOST_USER     = config('EMAIL_HOST_USER',     default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL  = config('DEFAULT_FROM_EMAIL',  default=EMAIL_HOST_USER)

EMAIL_OTP_TIMEOUT   = 300   # 5 daqiqa
EMAIL_OTP_MAX_TRIES = 5     # max noto'g'ri urinish

# ─── Firebase ─────────────────────────────────────────────────────────────────

FIREBASE_PROJECT_ID           = config('FIREBASE_PROJECT_ID', default='')
FIREBASE_SERVICE_ACCOUNT_PATH = config('FIREBASE_SERVICE_ACCOUNT_PATH', default='')

# ─── Telegram ─────────────────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN = config('TELEGRAM_BOT_TOKEN', default='')
TELEGRAM_BOT_NAME  = config('TELEGRAM_BOT_NAME',  default='ParvonaBot')

# ─── Jazzmin ──────────────────────────────────────────────────────────────────

JAZZMIN_SETTINGS = {
    # ── Branding ──────────────────────────────────────────────────────────────
    'site_title':        'Parvona Admin',
    'site_header':       'Parvona',
    'site_brand':        'Parvona',
    'welcome_sign':      'Parvona boshqaruv paneliga xush kelibsiz',
    'copyright':         'Parvona © 2025',
    'site_icon':         None,
    'site_logo':         None,
    'site_logo_classes': 'img-circle',

    # ── Search ────────────────────────────────────────────────────────────────
    'search_model': ['users.User', 'bookings.Booking', 'nannies.NannyProfile'],

    # ── User menu (top right) ─────────────────────────────────────────────────
    'user_avatar': 'photo',

    'topmenu_links': [
        {'name': 'Bosh sahifa',  'url': 'admin:index', 'permissions': ['auth.view_user']},
        {'name': 'API Docs',     'url': '/api/schema/swagger-ui/', 'new_window': True},
        {'model': 'users.User'},
    ],

    'usermenu_links': [
        {'name': 'Sayt',         'url': 'http://localhost:5173', 'new_window': True, 'icon': 'fas fa-globe'},
        {'name': 'API Swagger',  'url': '/api/schema/swagger-ui/', 'new_window': True, 'icon': 'fas fa-book'},
    ],

    # ── Sidebar nav ───────────────────────────────────────────────────────────
    'show_sidebar':          True,
    'navigation_expanded':   True,
    'hide_apps':             [],
    'hide_models':           [],

    'order_with_respect_to': [
        'users',
        'nannies',
        'bookings',
        'payments',
        'reviews',
        'chat',
        'notifications',
        'auth',
        'django_celery_beat',
        'django_celery_results',
        'token_blacklist',
    ],

    'icons': {
        # Apps
        'users':                        'fas fa-users',
        'nannies':                      'fas fa-baby',
        'bookings':                     'fas fa-calendar-check',
        'payments':                     'fas fa-credit-card',
        'reviews':                      'fas fa-star',
        'chat':                         'fas fa-comments',
        'notifications':                'fas fa-bell',
        'auth':                         'fas fa-shield-alt',
        'django_celery_beat':           'fas fa-clock',
        'django_celery_results':        'fas fa-tasks',

        # Models
        'users.User':                   'fas fa-user',
        'nannies.NannyProfile':         'fas fa-baby-carriage',
        'bookings.Booking':             'fas fa-clipboard-list',
        'payments.Payment':             'fas fa-money-bill-wave',
        'reviews.Review':               'fas fa-star-half-alt',
        'chat.Conversation':            'fas fa-comment-dots',
        'chat.Message':                 'fas fa-envelope',
        'notifications.Notification':   'fas fa-bell',
        'auth.Group':                   'fas fa-users-cog',
        'token_blacklist.BlacklistedToken':  'fas fa-ban',
        'token_blacklist.OutstandingToken':  'fas fa-key',
    },

    'default_icon_parents':  'fas fa-folder',
    'default_icon_children': 'fas fa-circle',

    # ── UI ────────────────────────────────────────────────────────────────────
    'related_modal_active':     True,
    'custom_css':               None,
    'custom_js':                None,
    'use_google_fonts_cdn':     True,
    'show_ui_builder':          False,
    'changeform_format':        'horizontal_tabs',
    'changeform_format_overrides': {
        'auth.user':  'collapsible',
        'auth.group': 'vertical_tabs',
    },

    # ── Language ──────────────────────────────────────────────────────────────
    'language_chooser': False,
}

JAZZMIN_UI_TWEAKS = {
    'navbar_small_text':       False,
    'footer_small_text':       False,
    'body_small_text':         False,
    'brand_small_text':        False,

    # Ranglar
    'brand_colour':            'navbar-primary',
    'accent':                  'accent-primary',
    'navbar':                  'navbar-dark navbar-primary',
    'no_navbar_border':        True,
    'navbar_fixed':            True,
    'layout_boxed':            False,
    'footer_fixed':            False,
    'sidebar_fixed':           True,
    'sidebar':                 'sidebar-dark-primary',
    'sidebar_nav_small_text':  False,
    'sidebar_disable_expand':  False,
    'sidebar_nav_child_indent': True,
    'sidebar_nav_compact_style': False,
    'sidebar_nav_legacy_style': False,
    'sidebar_nav_flat_style':  False,
    'theme':                   'default',
    'dark_mode_theme':        None,
    'button_classes': {
        'primary':   'btn-outline-primary',
        'secondary': 'btn-outline-secondary',
        'info':      'btn-info',
        'warning':   'btn-warning',
        'danger':    'btn-danger',
        'success':   'btn-success',
    },
}
