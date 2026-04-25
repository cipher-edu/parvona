from django.db import models
from core.models import BaseModel
from apps.users.models import User


class SupportConversation(BaseModel):
    STATUS_OPEN   = 'open'
    STATUS_CLOSED = 'closed'
    STATUS_CHOICES = [
        (STATUS_OPEN,   'Ochiq'),
        (STATUS_CLOSED, 'Yopiq'),
    ]

    user    = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='support_conversations',
        verbose_name='Foydalanuvchi',
        limit_choices_to={'role__in': ['parent', 'nanny']},
    )
    admin   = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='handled_conversations',
        verbose_name='Admin',
        limit_choices_to={'role': 'admin'},
    )
    subject = models.CharField(
        max_length=255,
        blank=True,
        default='Yordam so\'rovi',
        verbose_name='Mavzu',
    )
    status  = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
        verbose_name='Holat',
    )

    class Meta:
        db_table            = 'support_conversations'
        verbose_name        = 'Yordam suhbati'
        verbose_name_plural = 'Yordam suhbatlari'
        ordering            = ['-updated_at']

    def __str__(self):
        return f'{self.user.name} — {self.subject}'


class SupportMessage(BaseModel):
    conversation = models.ForeignKey(
        SupportConversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Suhbat',
    )
    sender  = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='support_messages',
        verbose_name='Yuboruvchi',
    )
    text    = models.TextField(verbose_name='Matn')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='O\'qilgan vaqt')

    class Meta:
        db_table            = 'support_messages'
        verbose_name        = 'Yordam xabari'
        verbose_name_plural = 'Yordam xabarlari'
        ordering            = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]

    def __str__(self):
        return f'{self.sender.name}: {self.text[:50]}'
