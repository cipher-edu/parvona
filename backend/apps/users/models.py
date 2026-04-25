import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, PermissionsMixin, BaseUserManager
)
from core.models import BaseModel


def _gen_ref_code():
    return uuid.uuid4().hex[:8].upper()


class UserManager(BaseUserManager):

    def create_user(self, email: str, password: str = None, **extra_fields):
        if not email:
            raise ValueError('Email majburiy maydon')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):

    class Role(models.TextChoices):
        PARENT = 'parent', 'Ota-ona'
        NANNY  = 'nanny',  'Enaga'
        ADMIN  = 'admin',  'Admin'

    email     = models.EmailField(unique=True, verbose_name='Email')
    name      = models.CharField(max_length=150, verbose_name='To\'liq ism')
    phone     = models.CharField(max_length=20, blank=True, verbose_name='Telefon')
    photo     = models.ImageField(
        upload_to='avatars/%Y/%m/',
        null=True, blank=True,
        verbose_name='Rasm'
    )
    role      = models.CharField(
        max_length=10,
        choices=Role.choices,
        verbose_name='Rol'
    )
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    is_staff  = models.BooleanField(default=False, verbose_name='Staff')

    # Telegram
    telegram_user_id = models.BigIntegerField(
        null=True, blank=True, unique=True,
        verbose_name='Telegram ID',
    )

    # Referral
    referral_code = models.CharField(
        max_length=12, unique=True, default=_gen_ref_code,
        verbose_name='Referal kod',
    )
    referred_by = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='referrals',
        verbose_name='Kim taklif qildi',
    )

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    class Meta:
        db_table  = 'users'
        verbose_name        = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f'{self.name} <{self.email}> [{self.role}]'

    @property
    def is_parent(self) -> bool:
        return self.role == self.Role.PARENT

    @property
    def is_nanny(self) -> bool:
        return self.role == self.Role.NANNY

    @property
    def is_admin_role(self) -> bool:
        return self.role == self.Role.ADMIN
