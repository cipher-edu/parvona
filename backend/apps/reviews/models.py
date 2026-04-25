from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from core.models import BaseModel
from apps.users.models import User
from apps.bookings.models import Booking


class Review(BaseModel):

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Buyurtma',
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        verbose_name='Muallif',
    )
    target = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        verbose_name='Baholanayotgan',
    )

    rating = models.PositiveSmallIntegerField(
        verbose_name='Baho',
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    text = models.TextField(verbose_name='Sharh matni')

    class Meta:
        db_table            = 'reviews'
        verbose_name        = 'Sharh'
        verbose_name_plural = 'Sharhlar'
        unique_together     = [('booking', 'author')]
        indexes = [
            models.Index(fields=['target', '-created_at']),
            models.Index(fields=['author']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name='review_rating_between_1_and_5',
            )
        ]

    def __str__(self):
        return f'{self.author.name} → {self.target.name}: {self.rating}★'

    def clean(self):
        if self.booking.status != 'completed':
            raise ValidationError('Faqat yakunlangan buyurtma uchun sharh qoldirish mumkin.')
        if self.author not in (self.booking.parent, self.booking.nanny):
            raise ValidationError('Faqat buyurtmaga aloqador tomonlar sharh qoldira oladi.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Celery orqali ratingni qayta hisoblash
        from apps.reviews.tasks import recalculate_nanny_rating
        recalculate_nanny_rating.delay(str(self.target.id))
