import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SupportConversation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('subject', models.CharField(blank=True, default="Yordam so'rovi", max_length=255, verbose_name='Mavzu')),
                ('status', models.CharField(
                    choices=[('open', 'Ochiq'), ('closed', 'Yopiq')],
                    default='open',
                    max_length=10,
                    verbose_name='Holat',
                )),
                ('admin', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='handled_conversations',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Admin',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='support_conversations',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Foydalanuvchi',
                )),
            ],
            options={
                'verbose_name': 'Yordam suhbati',
                'verbose_name_plural': 'Yordam suhbatlari',
                'db_table': 'support_conversations',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='SupportMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('text', models.TextField(verbose_name='Matn')),
                ('read_at', models.DateTimeField(blank=True, null=True, verbose_name="O'qilgan vaqt")),
                ('conversation', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages',
                    to='support.supportconversation',
                    verbose_name='Suhbat',
                )),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='support_messages',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Yuboruvchi',
                )),
            ],
            options={
                'verbose_name': 'Yordam xabari',
                'verbose_name_plural': 'Yordam xabarlari',
                'db_table': 'support_messages',
                'ordering': ['created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='supportmessage',
            index=models.Index(fields=['conversation', 'created_at'], name='support_msg_conv_idx'),
        ),
    ]
