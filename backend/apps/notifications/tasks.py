import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

# ─── Telegram helpers ────────────────────────────────────────────────────────

def _tg_notify(user, title: str, body: str):
    """User ga Telegram xabarnoma yuboradi (telegram_user_id bo'lsa)."""
    if not getattr(user, 'telegram_user_id', None):
        return
    try:
        from apps.users.management.commands.telegram_handlers import send_notification_to_user
        send_notification_to_user(user.telegram_user_id, title, body)
    except Exception as exc:
        logger.warning(f'Telegram notification xatosi (user {user.id}): {exc}')


def _tg_notify_admins(title: str, body: str):
    """Barcha admin foydalanuvchilarga Telegram xabarnoma yuboradi."""
    from apps.users.models import User
    admins = User.objects.filter(role='admin', telegram_user_id__isnull=False, is_active=True)
    for admin in admins:
        _tg_notify(admin, title, body)


# ─── Notification shablonlari ────────────────────────────────────────────────

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
        'recipient': 'both',
        'title':     'Xizmat yakunlandi',
        'body':      'Xizmat muvaffaqiyatli yakunlandi.',
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
    """Booking event ga asosan DB notification yaratadi va Telegram ga yuboradi."""
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

        now_str    = timezone.now().strftime('%d.%m.%Y %H:%M')
        amount_str = f"{int(booking.total_amount):,} so'm" if booking.total_amount else '—'
        reason     = booking.cancel_reason or '—'

        # ── Enaga uchun DB + Telegram ────────────────────────────────────────
        if recipient in ('nanny', 'both'):
            Notification.objects.create(
                user=booking.nanny, type=event,
                title=template['title'], body=body, data=data,
            )
            if event == 'new_booking':
                _tg_notify(
                    booking.nanny,
                    '📋 Yangi buyurtma!',
                    f'👨‍👩‍👧 Ota-ona: *{booking.parent.name}*\n'
                    f'📅 Sana: {booking.start_date} — {booking.end_date}\n'
                    f'⏱ Soatlik: {int(booking.hourly_rate):,} so\'m\n'
                    f'💵 Jami: {amount_str}\n\n'
                    f'Saytga o\'tib ko\'rib chiqing.',
                )
            elif event == 'booking_cancelled':
                _tg_notify(
                    booking.nanny,
                    '❌ Buyurtma bekor qilindi',
                    f'👨‍👩‍👧 Ota-ona: *{booking.parent.name}*\n'
                    f'📅 Sana: {booking.start_date}\n'
                    f'📝 Sabab: {reason}',
                )
            elif event == 'booking_completed':
                _tg_notify(
                    booking.nanny,
                    '✅ Xizmat yakunlandi',
                    f'👨‍👩‍👧 Ota-ona: *{booking.parent.name}*\n'
                    f'💵 To\'lov: {amount_str}\n'
                    f'🕐 Vaqt: {now_str}',
                )
            elif event == 'booking_disputed':
                _tg_notify(
                    booking.nanny,
                    '⚠️ Shikoyat ochildi',
                    f'👨‍👩‍👧 Ota-ona: *{booking.parent.name}*\n'
                    f'📅 Sana: {booking.start_date}\n'
                    f'Admin ko\'rib chiqmoqda. Saytda batafsil.',
                )
            elif event == 'booking_resolved':
                _tg_notify(
                    booking.nanny,
                    '✅ Shikoyat hal etildi',
                    f'👨‍👩‍👧 Ota-ona: *{booking.parent.name}*\n'
                    f'Admin tomonidan hal etildi. Saytda batafsil.',
                )
            elif event == 'payment_received':
                _tg_notify(
                    booking.nanny,
                    '💰 To\'lov qabul qilindi!',
                    f'👨‍👩‍👧 Ota-ona: *{booking.parent.name}*\n'
                    f'💵 Miqdor: {amount_str}\n'
                    f'🕐 Vaqt: {now_str}',
                )

        # ── Ota-ona uchun DB + Telegram ──────────────────────────────────────
        if recipient in ('parent', 'both'):
            Notification.objects.create(
                user=booking.parent, type=event,
                title=template['title'], body=body, data=data,
            )
            if event == 'booking_confirmed':
                _tg_notify(
                    booking.parent,
                    '✅ Buyurtma tasdiqlandi!',
                    f'👩‍🍼 Enaga: *{booking.nanny.name}*\n'
                    f'📅 Sana: {booking.start_date} — {booking.end_date}\n'
                    f'💵 Jami: {amount_str}\n\n'
                    f'Saytga o\'tib to\'lovni amalga oshiring.',
                )
            elif event == 'booking_active':
                _tg_notify(
                    booking.parent,
                    '🟢 Xizmat boshlandi!',
                    f'👩‍🍼 Enaga: *{booking.nanny.name}*\n'
                    f'📅 Boshlandi: {now_str}',
                )
            elif event == 'booking_completed':
                _tg_notify(
                    booking.parent,
                    '✅ Xizmat yakunlandi!',
                    f'👩‍🍼 Enaga: *{booking.nanny.name}*\n'
                    f'💵 Jami: {amount_str}\n'
                    f'⭐ Iltimos, enagaga sharh qoldiring!',
                )
            elif event == 'booking_cancelled':
                _tg_notify(
                    booking.parent,
                    '❌ Buyurtma bekor qilindi',
                    f'👩‍🍼 Enaga: *{booking.nanny.name}*\n'
                    f'📅 Sana: {booking.start_date}\n'
                    f'📝 Sabab: {reason}',
                )
            elif event == 'booking_disputed':
                _tg_notify(
                    booking.parent,
                    '⚠️ Shikoyat ochildi',
                    f'👩‍🍼 Enaga: *{booking.nanny.name}*\n'
                    f'📅 Sana: {booking.start_date}\n'
                    f'Admin ko\'rib chiqmoqda. Saytda batafsil.',
                )
            elif event == 'booking_resolved':
                _tg_notify(
                    booking.parent,
                    '✅ Shikoyat hal etildi',
                    f'👩‍🍼 Enaga: *{booking.nanny.name}*\n'
                    f'Admin tomonidan hal etildi. Saytda batafsil.',
                )

        # ── Admin bildirishnomalari (muhim hodisalar) ────────────────────────
        if event == 'new_booking':
            _tg_notify_admins(
                '📋 Yangi buyurtma',
                f'👨‍👩‍👧 {booking.parent.name}  →  👩‍🍼 {booking.nanny.name}\n'
                f'📅 {booking.start_date} — {booking.end_date}\n'
                f'💵 {amount_str}',
            )
        elif event == 'booking_disputed':
            _tg_notify_admins(
                '🚨 Shikoyat — DIQQAT!',
                f'👨‍👩‍👧 {booking.parent.name}  vs  👩‍🍼 {booking.nanny.name}\n'
                f'📅 {booking.start_date}\n'
                f'Adminpanelda ko\'rib chiqing!',
            )
        elif event == 'booking_cancelled':
            _tg_notify_admins(
                '❌ Buyurtma bekor qilindi',
                f'👨‍👩‍👧 {booking.parent.name}  /  👩‍🍼 {booking.nanny.name}\n'
                f'📅 {booking.start_date}  |  📝 {reason}',
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
