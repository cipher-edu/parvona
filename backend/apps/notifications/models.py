from django.db import models
from core.models import BaseModel
from apps.users.models import User


class Notification(BaseModel):

    class Type(models.TextChoices):
        NEW_BOOKING        = 'new_booking',        'Yangi buyurtma'
        BOOKING_CONFIRMED  = 'booking_confirmed',  'Buyurtma tasdiqlandi'
        BOOKING_ACTIVE     = 'booking_active',     'Xizmat boshlandi'
        BOOKING_COMPLETED  = 'booking_completed',  'Xizmat yakunlandi'
        BOOKING_CANCELLED  = 'booking_cancelled',  'Buyurtma bekor qilindi'
        BOOKING_DISPUTED   = 'booking_disputed',   'Shikoyat ochildi'
        BOOKING_RESOLVED   = 'booking_resolved',   'Shikoyat hal etildi'
        PAYMENT_RECEIVED   = 'payment_received',   'To\'lov qabul qilindi'
        REVIEW_RECEIVED    = 'review_received',    'Yangi sharh'
        NANNY_VERIFIED     = 'nanny_verified',     'Profil tasdiqlandi'
        SYSTEM             = 'system',             'Tizim xabari'

    user    = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Foydalanuvchi',
    )
    type    = models.CharField(max_length=30, choices=Type.choices, verbose_name='Tur')
    title   = models.CharField(max_length=150, verbose_name='Sarlavha')
    body    = models.TextField(verbose_name='Matn')
    data    = models.JSONField(default=dict, blank=True, verbose_name='Qo\'shimcha ma\'lumot')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='O\'qilgan vaqt')

    class Meta:
        db_table            = 'notifications'
        verbose_name        = 'Xabarnoma'
        verbose_name_plural = 'Xabarnomalar'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'read_at']),
        ]

    def __str__(self):
        return f'{self.user.name}: {self.title}'

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
