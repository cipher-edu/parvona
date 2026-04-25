import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nannies', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='NannyAvailability',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('date', models.DateField(verbose_name='Sana')),
                ('status', models.CharField(
                    choices=[('available', "Bo'sh"), ('busy', 'Band'), ('vacation', "Ta'tilda")],
                    default='available',
                    max_length=10,
                    verbose_name='Holat',
                )),
                ('nanny', models.ForeignKey(
                    limit_choices_to={'role': 'nanny'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='availability',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Enaga',
                )),
            ],
            options={
                'verbose_name': 'Enaga mavjudligi',
                'verbose_name_plural': 'Enaga mavjudligi',
                'db_table': 'nanny_availability',
                'unique_together': {('nanny', 'date')},
            },
        ),
        migrations.AddIndex(
            model_name='nannyavailability',
            index=models.Index(fields=['nanny', 'date'], name='nanny_avail_nanny_date_idx'),
        ),
    ]
