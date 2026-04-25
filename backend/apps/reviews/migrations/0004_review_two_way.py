import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reviews', '0003_add_rating_check_constraint'),
        ('bookings', '0004_add_is_trial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Drop the OneToOne constraint by altering to FK
        migrations.AlterField(
            model_name='review',
            name='booking',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='reviews',
                to='bookings.booking',
                verbose_name='Buyurtma',
            ),
        ),
        # 2. Add unique_together (booking, author) — one review per actor per booking
        migrations.AlterUniqueTogether(
            name='review',
            unique_together={('booking', 'author')},
        ),
    ]
