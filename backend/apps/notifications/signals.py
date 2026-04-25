"""
Booking holati o'zgarganda real-time notification yuboradi.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver


BOOKING_MESSAGES = {
    'confirmed':  ('Buyurtma tasdiqlandi',   'Enaga buyurtmangizni qabul qildi.'),
    'active':     ('Xizmat boshlandi',        'Enaga hozir faol xizmatda.'),
    'completed':  ('Xizmat yakunlandi',       'Buyurtma muvaffaqiyatli yakunlandi.'),
    'cancelled':  ('Buyurtma bekor qilindi',  'Buyurtma bekor qilindi.'),
    'disputed':   ('Shikoyat ochildi',        'Nizoli holat qayd etildi.'),
    'resolved':   ('Nizo hal etildi',         'Shikoyat muvaffaqiyatli yechildi.'),
}


def _push(user_id, notif_obj):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        f'notifications_{user_id}',
        {
            'type':       'notification_push',
            'id':         str(notif_obj.id),
            'notif_type': notif_obj.type,
            'title':      notif_obj.title,
            'body':       notif_obj.body,
            'data':       notif_obj.data,
            'created_at': notif_obj.created_at.isoformat(),
        }
    )
    # Unread count ni ham yangilash
    from apps.notifications.models import Notification
    count = Notification.objects.filter(user_id=user_id, read_at__isnull=True).count()
    async_to_sync(channel_layer.group_send)(
        f'notifications_{user_id}',
        {'type': 'unread_count', 'count': count}
    )


@receiver(post_save, sender='bookings.Booking')
def booking_status_notification(sender, instance, created, **kwargs):
    from apps.notifications.models import Notification

    if created:
        # Enagaga yangi buyurtma bildirishnomasi
        title = 'Yangi buyurtma keldi'
        body  = f'{instance.parent.name} sizga buyurtma berdi.'
        notif = Notification.objects.create(
            user=instance.nanny,
            type=Notification.Type.NEW_BOOKING,
            title=title,
            body=body,
            data={'booking_id': str(instance.id)},
        )
        _push(instance.nanny_id, notif)
        return

    # Holat o'zgarishini aniqlash
    if not hasattr(instance, '_prev_status'):
        return

    status = instance.status
    if status not in BOOKING_MESSAGES:
        return

    title, body = BOOKING_MESSAGES[status]

    # Ota-onaga yuborish (confirmed, active, completed, cancelled, disputed, resolved)
    notif_type_map = {
        'confirmed': Notification.Type.BOOKING_CONFIRMED,
        'active':    Notification.Type.BOOKING_ACTIVE,
        'completed': Notification.Type.BOOKING_COMPLETED,
        'cancelled': Notification.Type.BOOKING_CANCELLED,
        'disputed':  Notification.Type.BOOKING_DISPUTED,
        'resolved':  Notification.Type.BOOKING_RESOLVED,
    }
    notif_type = notif_type_map.get(status, Notification.Type.SYSTEM)

    notif_parent = Notification.objects.create(
        user=instance.parent,
        type=notif_type,
        title=title,
        body=body,
        data={'booking_id': str(instance.id)},
    )
    _push(instance.parent_id, notif_parent)

    # Enagaga ham xabar (bekor qilinsa)
    if status == 'cancelled':
        notif_nanny = Notification.objects.create(
            user=instance.nanny,
            type=Notification.Type.BOOKING_CANCELLED,
            title=title,
            body=f'Ota-ona buyurtmani bekor qildi.',
            data={'booking_id': str(instance.id)},
        )
        _push(instance.nanny_id, notif_nanny)
