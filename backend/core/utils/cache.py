"""
Redis cache yordamchi funksiyalar.
django-redis da delete_pattern django cache API da yo'q —
to'g'ridan-to'g'ri redis connection ishlatiladi.
"""
from django.core.cache import cache


def delete_pattern(pattern: str) -> int:
    """
    Redis key pattern bo'yicha o'chirish.
    Pattern: 'parvona:1:nannies:*'
    Qaytaradi: o'chirilgan keylar soni.
    """
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")
        keys = redis_conn.keys(pattern)
        if keys:
            return redis_conn.delete(*keys)
        return 0
    except Exception:
        # Redis ulanmagan yoki django-redis yo'q — silent fail
        return 0


def invalidate_nanny_cache(nanny_id: str = None) -> None:
    """Barcha nanny ro'yxat va detail cache larini tozalash."""
    delete_pattern("*nannies:*")
    if nanny_id:
        cache.delete(f"nanny:detail:{nanny_id}")
