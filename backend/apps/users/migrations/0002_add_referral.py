import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def populate_referral_codes(apps, schema_editor):
    """Mavjud har bir foydalanuvchiga unique referral_code yozish."""
    User = apps.get_model('users', 'User')
    db_alias = schema_editor.connection.alias
    used = set()
    users = User.objects.using(db_alias).all()
    for user in users:
        code = uuid.uuid4().hex[:8].upper()
        while code in used:
            code = uuid.uuid4().hex[:8].upper()
        used.add(code)
        user.referral_code = code
    User.objects.using(db_alias).bulk_update(users, ['referral_code'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # 1. Ustunni UNIQUE va DEFAULT siz qo'sh (bo'sh string bilan)
        migrations.AddField(
            model_name='user',
            name='referral_code',
            field=models.CharField(
                max_length=12,
                default='',
                verbose_name='Referal kod',
            ),
            preserve_default=False,
        ),
        # 2. Mavjud qatorlarga unique kodlar yoz
        migrations.RunPython(populate_referral_codes, migrations.RunPython.noop),
        # 3. Unique constraint qo'sh
        migrations.AlterField(
            model_name='user',
            name='referral_code',
            field=models.CharField(
                max_length=12,
                unique=True,
                default='',
                verbose_name='Referal kod',
            ),
        ),
        # 4. referred_by ustuni
        migrations.AddField(
            model_name='user',
            name='referred_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='referrals',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Kim taklif qildi',
            ),
        ),
    ]
