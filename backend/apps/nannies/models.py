from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import BaseModel
from apps.users.models import User


class NannySkill(models.TextChoices):
    INFANT_CARE   = 'infant_care',   'Chaqaloq parvarishi'
    SCHOOL_PREP   = 'school_prep',   'Maktabga tayyorlov'
    ENGLISH       = 'english',       'Ingliz tili'
    FIRST_AID     = 'first_aid',     'Birinchi yordam'
    COOKING       = 'cooking',       'Ovqat pishirish'
    TUTORING      = 'tutoring',      'Repetitorlik'
    SPECIAL_NEEDS = 'special_needs', 'Maxsus ehtiyojlar'
    DRIVING       = 'driving',       'Haydovchilik'


class NannyProfile(BaseModel):

    class Status(models.TextChoices):
        ACTIVE    = 'active',    'Faol'
        INACTIVE  = 'inactive',  'Nofaol'
        SUSPENDED = 'suspended', 'Bloklangan'

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='nanny_profile',
        verbose_name='Foydalanuvchi',
        limit_choices_to={'role': 'nanny'},
    )

    age = models.PositiveSmallIntegerField(
        verbose_name='Yosh', null=True, blank=True,
        validators=[MinValueValidator(18), MaxValueValidator(65)]
    )
    experience = models.PositiveSmallIntegerField(
        verbose_name='Tajriba (yil)', default=0
    )
    hourly_rate = models.PositiveIntegerField(
        verbose_name="Soatlik narx (so'm)",
        null=True, blank=True,
        validators=[MinValueValidator(10_000)]
    )
    bio = models.TextField(verbose_name="O'zi haqida", blank=True, default='')
    skills = models.JSONField(default=list, verbose_name="Ko'nikmalar")
    video = models.FileField(upload_to='nanny_videos/%Y/%m/', blank=True, null=True, verbose_name='Video')

    latitude = models.FloatField(null=True, blank=True, verbose_name='Kenglik')
    longitude = models.FloatField(null=True, blank=True, verbose_name='Uzunlik')
    location_name = models.CharField(max_length=200, blank=True, default='', verbose_name='Joylashuv nomi')

    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0, verbose_name='Reyting')
    reviews_count = models.PositiveIntegerField(default=0, verbose_name='Sharhlar soni')

    is_verified = models.BooleanField(default=False, verbose_name='Tasdiqlangan')
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='verified_nannies', verbose_name='Kim tasdiqladi',
    )

    status = models.CharField(
        max_length=10, choices=Status.choices,
        default=Status.ACTIVE, verbose_name='Holat',
    )

    class Meta:
        db_table            = 'nanny_profiles'
        verbose_name        = 'Enaga profili'
        verbose_name_plural = 'Enaga profillari'
        indexes = [
            models.Index(fields=['status', 'is_verified']),
            models.Index(fields=['-rating']),
            models.Index(fields=['hourly_rate']),
        ]

    def __str__(self):
        return self.user.name


class NannyAvailability(models.Model):

    class DayStatus(models.TextChoices):
        AVAILABLE = 'available', "Bo'sh"
        BUSY      = 'busy',      'Band'
        VACATION  = 'vacation',  "Ta'tilda"

    nanny = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='availability',
        limit_choices_to={'role': 'nanny'},
        verbose_name='Enaga',
    )
    date = models.DateField(verbose_name='Sana')
    status = models.CharField(
        max_length=10, choices=DayStatus.choices,
        default=DayStatus.AVAILABLE, verbose_name='Holat',
    )

    class Meta:
        db_table            = 'nanny_availability'
        verbose_name        = 'Enaga mavjudligi'
        verbose_name_plural = 'Enaga mavjudligi'
        unique_together     = [('nanny', 'date')]
        indexes             = [models.Index(fields=['nanny', 'date'])]

    def __str__(self):
        return f'{self.nanny.name} | {self.date}'


class NannyDocument(BaseModel):

    class DocType(models.TextChoices):
        PASSPORT    = 'passport',    'Pasport'
        CERTIFICATE = 'certificate', 'Sertifikat'
        MEDICAL     = 'medical',     'Tibbiy hujjat'
        DIPLOMA     = 'diploma',     'Diplom'
        OTHER       = 'other',       'Boshqa'

    class DocStatus(models.TextChoices):
        PENDING  = 'pending',  "Ko'rib chiqilmoqda"
        APPROVED = 'approved', 'Tasdiqlangan'
        REJECTED = 'rejected', 'Rad etilgan'

    nanny = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='documents',
        limit_choices_to={'role': 'nanny'},
        verbose_name='Enaga',
    )
    doc_type = models.CharField(
        max_length=20, choices=DocType.choices, verbose_name='Hujjat turi',
    )
    file = models.FileField(upload_to='nanny_docs/%Y/%m/', verbose_name='Fayl')
    description = models.CharField(max_length=200, blank=True, verbose_name='Tavsif')
    status = models.CharField(
        max_length=10, choices=DocStatus.choices,
        default=DocStatus.PENDING, verbose_name='Holat',
    )
    review_note = models.TextField(blank=True, verbose_name='Admin izohi')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='reviewed_documents', verbose_name='Tekshirgan',
    )

    class Meta:
        db_table            = 'nanny_documents'
        verbose_name        = 'Enaga hujjati'
        verbose_name_plural = 'Enaga hujjatlari'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.nanny.name} -- {self.doc_type}'
