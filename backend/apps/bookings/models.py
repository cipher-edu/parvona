from decimal import Decimal
from django.db import models
from django.utils import timezone
from core.models import BaseModel
from apps.users.models import User
from .state_machine import validate_transition, validate_actor


class Booking(BaseModel):

    class Status(models.TextChoices):
        PENDING   = 'pending',   'Kutilmoqda'
        CONFIRMED = 'confirmed', 'Tasdiqlangan'
        ACTIVE    = 'active',    'Faol'
        COMPLETED = 'completed', 'Yakunlangan'
        CANCELLED = 'cancelled', 'Bekor qilingan'
        DISPUTED  = 'disputed',  'Shikoyat'
        RESOLVED  = 'resolved',  'Hal etildi'

    parent = models.ForeignKey(
        User, on_delete=models.PROTECT,
        related_name='bookings_as_parent',
        verbose_name='Ota-ona',
        limit_choices_to={'role': 'parent'},
    )
    nanny = models.ForeignKey(
        User, on_delete=models.PROTECT,
        related_name='bookings_as_nanny',
        verbose_name='Enaga',
        limit_choices_to={'role': 'nanny'},
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Holat',
    )

    start_date    = models.DateField(verbose_name='Boshlanish sanasi')
    end_date      = models.DateField(verbose_name='Tugash sanasi')
    hours_per_day = models.DecimalField(
        max_digits=4, decimal_places=1,
        verbose_name='Kunlik soat',
    )

    # Narx snapshot — booking vaqtidagi narx saqlanadi
    hourly_rate  = models.PositiveIntegerField(verbose_name='Soatlik narx (snapshot)')
    total_amount = models.PositiveIntegerField(verbose_name='Jami summa')

    address       = models.CharField(max_length=300, verbose_name='Manzil')
    notes         = models.TextField(blank=True, verbose_name='Izoh')
    cancel_reason = models.TextField(blank=True, verbose_name='Bekor qilish sababi')
    is_trial      = models.BooleanField(default=False, verbose_name='Sinov darsi')

    # Narx tafsilotlari (dinamik narxlash)
    price_details = models.JSONField(
        default=dict, blank=True,
        verbose_name='Narx tafsilotlari',
        help_text='base, surcharge, discount breakdown'
    )

    # Timestamp lar
    confirmed_at = models.DateTimeField(null=True, blank=True)
    started_at   = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table            = 'bookings'
        verbose_name        = 'Buyurtma'
        verbose_name_plural = 'Buyurtmalar'
        indexes = [
            models.Index(fields=['parent', 'status']),
            models.Index(fields=['nanny',  'status']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f'Booking #{str(self.id)[:8]} | {self.parent} → {self.nanny} [{self.status}]'

    @property
    def total_days(self) -> int:
        return (self.end_date - self.start_date).days + 1

    def calculate_total(self) -> int:
        days  = self.total_days
        hours = Decimal(str(self.hours_per_day))
        return int(days * hours * self.hourly_rate)

    def transition_to(self, new_status: str, actor: User) -> None:
        """State machine orqali holatni o'zgartirish."""
        validate_transition(self.status, new_status)
        validate_actor(new_status, actor.role, actor.id, self)

        self._prev_status = self.status
        self.status = new_status
        now = timezone.now()

        ts_map = {
            'confirmed': 'confirmed_at',
            'active':    'started_at',
            'completed': 'completed_at',
            'cancelled': 'cancelled_at',
        }
        if new_status in ts_map:
            setattr(self, ts_map[new_status], now)

        update_fields = ['status', 'updated_at']
        if new_status in ts_map:
            update_fields.append(ts_map[new_status])
        self.save(update_fields=update_fields)
