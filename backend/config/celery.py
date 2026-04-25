import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('parvona')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.broker_connection_retry_on_startup = True
app.autodiscover_tasks()

# ─── Periodic tasks ───────────────────────────────────────────────────────────

app.conf.beat_schedule = {
    'expire-pending-bookings': {
        'task':     'bookings.expire_pending_bookings',
        'schedule': 3600,   # har soatda
    },
    'cleanup-old-notifications': {
        'task':     'notifications.cleanup_old_notifications',
        'schedule': 86400,  # har kunda
    },
}
