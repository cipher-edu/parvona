from django.db import models
from core.models import BaseModel
from apps.users.models import User
from apps.bookings.models import Booking


class Conversation(BaseModel):
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='conversation',
        verbose_name='Buyurtma',
    )

    class Meta:
        db_table            = 'conversations'
        verbose_name        = 'Suhbat'
        verbose_name_plural = 'Suhbatlar'

    def __str__(self):
        return f'Suhbat: {self.booking}'


class Message(BaseModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Suhbat',
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='Yuboruvchi',
    )
    text    = models.TextField(verbose_name='Matn')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='O\'qilgan vaqt')

    class Meta:
        db_table            = 'messages'
        verbose_name        = 'Xabar'
        verbose_name_plural = 'Xabarlar'
        ordering            = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]

    def __str__(self):
        return f'{self.sender.name}: {self.text[:50]}'
