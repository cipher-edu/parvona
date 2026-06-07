from django.apps import AppConfig


class NanniesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.nannies'
    verbose_name = 'Enagalar'

    def ready(self):
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        @receiver(post_save, sender='users.User')
        def create_nanny_profile(sender, instance, created, **kwargs):
            if created and instance.role == 'nanny':
                from apps.nannies.models import NannyProfile
                NannyProfile.objects.get_or_create(user=instance)
