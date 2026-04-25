from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0003_add_price_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='is_trial',
            field=models.BooleanField(default=False, verbose_name='Sinov darsi'),
        ),
    ]
