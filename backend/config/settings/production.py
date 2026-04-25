from .base import *  # noqa
import sentry_sdk
from decouple import config

DEBUG = False

MIDDLEWARE = [                              # noqa
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
] + MIDDLEWARE[1:]  # noqa

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

SECURE_BROWSER_XSS_FILTER       = True
SECURE_CONTENT_TYPE_NOSNIFF     = True
X_FRAME_OPTIONS                 = 'DENY'
SECURE_HSTS_SECONDS             = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS  = True
SESSION_COOKIE_SECURE           = True
SESSION_COOKIE_HTTPONLY         = True
CSRF_COOKIE_SECURE              = True
SECURE_SSL_REDIRECT             = True
SECURE_PROXY_SSL_HEADER         = ('HTTP_X_FORWARDED_PROTO', 'https')

sentry_sdk.init(
    dsn=config('SENTRY_DSN', default=''),
    traces_sample_rate=0.1,
    environment='production',
)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'json'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}
