import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

# Notification shablonlari
BOOKING_NOTIFICATIONS = {
    'new_booking': {
        'recipient': 'nanny',
        'title':     'Yangi buyurtma!',
        'body':      '{parent_name} sizga buyurtma yubordi. Ko\'rib chiqing.',
    },
    'booking_confirmed': {
        'recipient': 'parent',
        'title':     'Buyurtma tasdiqlandi ✓',
        'body':      '{nanny_name} buyurtmangizni tasdiqladi.',
    },
    'booking_active': {
        'recipient': 'parent',
        'title':     'Xizmat boshlandi',
        'body':      '{nanny_name} xizmat ko\'rsatishni boshladi.',
    },
    'booking_completed': {
        'recipient': 'parent',
        'title':     'Xizmat yakunlandi',
        'body':      'Xizmat muvaffaqiyatli yakunlandi. Sharh qoldiring!',
    },
    'booking_cancelled': {
        'recipient': 'both',
        'title':     'Buyurtma bekor qilindi',
        'body':      'Buyurtma bekor qilindi.',
    },
    'booking_disputed': {
        'recipient': 'both',
        'title':     'Shikoyat ochildi',
        'body':      'Buyurtma bo\'yicha shikoyat admin ko\'rib chiqmoqda.',
    },
    'booking_resolved': {
        'recipient': 'both',
        'title':     'Shikoyat hal etildi',
        'body':      'Admin shikoyatni ko\'rib chiqdi va hal etdi.',
    },
    'payment_received': {
        'recipient': 'nanny',
        'title':     'To\'lov qabul qilindi 💰',
        'body':      'Buyurtma uchun to\'lov muvaffaqiyatli amalga oshirildi.',
    },
}


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='notifications.send_booking_notification',
)
def send_booking_notification(self, booking_id: str, event: str):
    """Booking event ga asosan notification yaratadi."""
    try:
        from apps.bookings.models import Booking
        from .models import Notification

        template = BOOKING_NOTIFICATIONS.get(event)
        if not template:
            return f'Noma\'lum event: {event}'

        booking = Booking.objects.select_related('parent', 'nanny').get(id=booking_id)

        body = template['body'].format(
            parent_name=booking.parent.name,
            nanny_name=booking.nanny.name,
        )
        data = {'booking_id': booking_id, 'event': event}

        recipient = template['recipient']

        if recipient in ('nanny', 'both'):
            Notification.objects.create(
                user  = booking.nanny,
                type  = event,
                title = template['title'],
                body  = body,
                data  = data,
            )
        if recipient in ('parent', 'both'):
            Notification.objects.create(
                user  = booking.parent,
                type  = event,
                title = template['title'],
                body  = body,
                data  = data,
            )

        return f'Notification yuborildi: {event} for booking {booking_id}'

    except Exception as exc:
        logger.exception(f'Notification xatosi: {exc}')
        raise self.retry(exc=exc)


@shared_task(name='notifications.cleanup_old_notifications')
def cleanup_old_notifications():
    """30 kundan eski o'qilgan notificationlarni o'chiradi."""
    from .models import Notification

    threshold = timezone.now() - timedelta(days=30)
    deleted, _ = Notification.objects.filter(
        read_at__isnull=False,
        created_at__lt=threshold,
    ).delete()
    return f'{deleted} ta eski xabarnoma o\'chirildi'
