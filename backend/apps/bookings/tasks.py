from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task(name='bookings.expire_pending_bookings')
def expire_pending_bookings():
    """
    24 soat ichida tasdiqlanmagan 'pending' buyurtmalarni bekor qiladi.
    Celery Beat tomonidan har soatda chaqiriladi.
    """
    from .models import Booking

    threshold = timezone.now() - timedelta(hours=24)
    expired   = Booking.objects.filter(
        status='pending',
        created_at__lt=threshold,
    )
    count = expired.count()
    expired.update(
        status='cancelled',
        cancelled_at=timezone.now(),
        cancel_reason='24 soat ichida tasdiqlanmadi — avtomatik bekor qilindi',
    )
    return f'{count} ta buyurtma muddati o\'tganligi sababli bekor qilindi'
