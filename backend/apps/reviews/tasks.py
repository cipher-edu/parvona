from celery import shared_task
from django.db.models import Avg, Count


@shared_task(bind=True, max_retries=3, default_retry_delay=60,
             name='reviews.recalculate_nanny_rating')
def recalculate_nanny_rating(self, nanny_user_id: str):
    """
    Enaga reytingini qayta hisoblaydi.
    Review saqlanganidan so'ng Celery orqali chaqiriladi.
    """
    try:
        from .models import Review
        from apps.nannies.models import NannyProfile
        from django.core.cache import cache

        stats = Review.objects.filter(
            target_id=nanny_user_id
        ).aggregate(
            avg_rating=Avg('rating'),
            total=Count('id'),
        )

        NannyProfile.objects.filter(user_id=nanny_user_id).update(
            rating        = round(stats['avg_rating'] or 0, 1),
            reviews_count = stats['total'],
        )

        # Cache tozalash
        cache.delete(f'nanny:detail:{nanny_user_id}')
        cache.delete_pattern('nannies:*')

        return f'Reyting yangilandi: {stats["avg_rating"]:.1f} ({stats["total"]} ta sharh)'

    except Exception as exc:
        raise self.retry(exc=exc)
