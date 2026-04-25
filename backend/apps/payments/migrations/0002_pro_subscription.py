import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProSubscription',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('plan', models.CharField(
                    choices=[('monthly', 'Oylik'), ('yearly', 'Yillik')],
                    max_length=10,
                    verbose_name='Reja',
                )),
                ('expires_at', models.DateTimeField(verbose_name='Tugash vaqti')),
                ('is_active', models.BooleanField(default=True, verbose_name='Faol')),
                ('nanny', models.OneToOneField(
                    limit_choices_to={'role': 'nanny'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='pro_subscription',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Enaga',
                )),
            ],
            options={
                'verbose_name': 'Pro obuna',
                'verbose_name_plural': 'Pro obunalar',
                'db_table': 'pro_subscriptions',
            },
        ),
    ]
