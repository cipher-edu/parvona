from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nannies', '0004_nannydocument_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='nannyprofile',
            name='video_url',
        ),
        migrations.AddField(
            model_name='nannyprofile',
            name='video',
            field=models.FileField(blank=True, null=True, upload_to='nanny_videos/%Y/%m/', verbose_name='Video'),
        ),
    ]
