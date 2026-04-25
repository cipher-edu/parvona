from django.db import models
from django.utils import timezone
from core.models import BaseModel
from apps.bookings.models import Booking


class Payment(BaseModel):

    class Status(models.TextChoices):
        PENDING   = 'pending',  'Kutilmoqda'
        PAID      = 'paid',     'To\'langan'
        FAILED    = 'failed',   'Muvaffaqiyatsiz'
        REFUNDED  = 'refunded', 'Qaytarilgan'
        CANCELLED = 'cancelled','Bekor qilingan'

    class Provider(models.TextChoices):
        PAYME = 'payme', 'Payme'
        CLICK = 'click', 'Click'
        UZUM  = 'uzum',  'Uzum Bank'

    booking  = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name='Buyurtma',
    )
    provider       = models.CharField(max_length=10, choices=Provider.choices, verbose_name='Provider')
    provider_tx_id = models.CharField(max_length=100, unique=True, null=True, blank=True,
                                      verbose_name='Provider tranzaksiya ID')
    amount         = models.PositiveIntegerField(verbose_name='Summa (tiyin)')
    status         = models.CharField(max_length=10, choices=Status.choices,
                                      default=Status.PENDING, verbose_name='Holat')

    paid_at        = models.DateTimeField(null=True, blank=True)
    failed_at      = models.DateTimeField(null=True, blank=True)
    refunded_at    = models.DateTimeField(null=True, blank=True)
    refund_reason  = models.TextField(blank=True)

    metadata       = models.JSONField(default=dict, blank=True,
                                      verbose_name='Provider meta')

    class Meta:
        db_table            = 'payments'
        verbose_name        = 'To\'lov'
        verbose_name_plural = 'To\'lovlar'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['provider', 'provider_tx_id']),
        ]

    def __str__(self):
        return f'{self.provider} | {self.amount // 100:,} so\'m | {self.status}'


class ProSubscription(BaseModel):
    """Enaga Parvona Pro obunasi."""

    class Plan(models.TextChoices):
        MONTHLY  = 'monthly',  'Oylik'
        YEARLY   = 'yearly',   'Yillik'

    PLAN_PRICES = {
        'monthly': 49_000,   # so'm
        'yearly':  449_000,  # so'm
    }

    nanny      = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='pro_subscription',
        limit_choices_to={'role': 'nanny'},
        verbose_name='Enaga',
    )
    plan       = models.CharField(max_length=10, choices=Plan.choices, verbose_name='Reja')
    expires_at = models.DateTimeField(verbose_name='Tugash vaqti')
    is_active  = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        db_table     = 'pro_subscriptions'
        verbose_name = 'Pro obuna'
        verbose_name_plural = 'Pro obunalar'

    def __str__(self):
        return f'{self.nanny.name} — {self.plan} ({"faol" if self.is_active else "nofaol"})'

    @property
    def is_valid(self) -> bool:
        return self.is_active and self.expires_at > timezone.now()
