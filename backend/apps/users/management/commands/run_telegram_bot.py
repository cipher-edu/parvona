"""
Telegram bot management command.

Ishlatish:
    python manage.py run_telegram_bot

.env da kerakli o'zgaruvchilar:
    TELEGRAM_BOT_TOKEN=<BotFather dan olingan token>
    TELEGRAM_WEBHOOK_URL=   # bo'sh bo'lsa polling mode ishlatiladi

Bot buyruqlari:
    /start      — Xush kelibsiz + akkaunt ulash
    /profile    — Profilim
    /bookings   — Faol buyurtmalarim
    /support    — Yordam so'rash
    /help       — Yordam
"""

import logging
import os
import django

from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


def get_bot_token():
    from django.conf import settings
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or os.environ.get('TELEGRAM_BOT_TOKEN', '')
    return token.strip()


class Command(BaseCommand):
    help = 'Telegram bot ishga tushirish'

    def add_arguments(self, parser):
        parser.add_argument('--webhook', action='store_true', help='Webhook mode (default: polling)')

    def handle(self, *args, **options):
        try:
            from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, filters
        except ImportError:
            self.stderr.write('python-telegram-bot o\'rnatilmagan. pip install python-telegram-bot==21.6')
            return

        token = get_bot_token()
        if not token:
            self.stderr.write('TELEGRAM_BOT_TOKEN .env da yo\'q yoki bo\'sh')
            return

        from .telegram_handlers import (
            start_handler, profile_handler, bookings_handler,
            support_handler, help_handler, connect_handler,
            button_handler, unknown_handler,
        )

        app = ApplicationBuilder().token(token).build()

        app.add_handler(CommandHandler('start',    start_handler))
        app.add_handler(CommandHandler('profile',  profile_handler))
        app.add_handler(CommandHandler('bookings', bookings_handler))
        app.add_handler(CommandHandler('support',  support_handler))
        app.add_handler(CommandHandler('help',     help_handler))
        app.add_handler(CommandHandler('connect',  connect_handler))
        app.add_handler(CallbackQueryHandler(button_handler))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown_handler))

        webhook_url = getattr(django.conf.settings, 'TELEGRAM_WEBHOOK_URL', '').strip() if options['webhook'] else ''

        if webhook_url:
            self.stdout.write(f'Webhook mode: {webhook_url}')
            app.run_webhook(
                listen='0.0.0.0',
                port=8443,
                webhook_url=webhook_url,
            )
        else:
            self.stdout.write('Polling mode ishga tushdi...')
            app.run_polling(drop_pending_updates=True)
