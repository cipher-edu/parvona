"""Telegram bot handler funksiyalari."""
import logging
import secrets
from asgiref.sync import sync_to_async
from telegram import Update
from telegram.ext import ContextTypes

logger = logging.getLogger(__name__)

WELCOME_TEXT = (
    "👶 *Parvona botiga xush kelibsiz!*\n\n"
    "Men sizga quyidagilarda yordam bera olaman:\n"
    "• 📋 Buyurtmalaringizni ko'rish\n"
    "• 👤 Profilingizni tekshirish\n"
    "• 🔔 Bildirishnomalar olish\n\n"
    "Ro'yxatdan o'tish uchun saytga o'ting va "
    "\"Telegram orqali tasdiqlash\" tugmasini bosing."
)

HELP_TEXT = (
    "📌 *Mavjud buyruqlar:*\n\n"
    "/start — Boshlanish\n"
    "/profile — Profilim\n"
    "/bookings — Buyurtmalarim\n"
    "/support — Yordam\n"
    "/connect — Akkaunt ulash\n"
    "/help — Yordam"
)


@sync_to_async
def _get_user_by_telegram_id(telegram_id: int):
    try:
        from apps.users.models import User
        return User.objects.filter(telegram_user_id=telegram_id).first()
    except Exception:
        return None


@sync_to_async
def _get_active_bookings(user):
    try:
        from apps.bookings.models import Booking
        from django.db.models import Q
        qs = (
            Booking.objects
            .filter(Q(parent=user) | Q(nanny=user), status__in=['pending', 'confirmed', 'active'])
            .select_related('parent', 'nanny')
            .order_by('-created_at')[:5]
        )
        return list(qs)
    except Exception:
        return []


@sync_to_async
def _process_otp_token(reg_token: str, chat_id: int):
    """Cache dan reg_data ni olib, OTP va chat_id ni saqlaydi."""
    from django.core.cache import cache
    reg_data = cache.get(f'tg_reg:{reg_token}')
    if not reg_data:
        return None
    otp = str(secrets.randbelow(900000) + 100000)
    timeout = 300
    cache.set(f'tg_otp:{reg_token}',          otp,     timeout=timeout)
    cache.set(f'tg_chat:{reg_token}',          chat_id, timeout=timeout)
    cache.set(f'tg_otp_attempts:{reg_token}',  0,       timeout=timeout)
    return {'otp': otp, 'name': reg_data.get('name', ''), 'email': reg_data.get('email', '')}


@sync_to_async
def _get_login_otp(login_token: str):
    from django.core.cache import cache
    otp = cache.get(f'tg_login_otp:{login_token}')
    uid = cache.get(f'tg_login_uid:{login_token}')
    return otp, uid


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tg_user = update.effective_user
    args = context.args  # deep link payload

    # ── Ro'yxatdan o'tish OTP oqimi ─────────────────────────────────────────
    if args and args[0].startswith('OTP_'):
        reg_token = args[0][4:]
        result = await _process_otp_token(reg_token, tg_user.id)
        if not result:
            await update.message.reply_text(
                "❌ Ro'yxatdan o'tish so'rovi topilmadi yoki muddati o'tgan.\n\n"
                "Parvona saytida qaytadan urinib ko'ring."
            )
            return
        await update.message.reply_text(
            f"👋 Salom, *{tg_user.first_name}*!\n\n"
            f"🔐 *Parvona* saytiga ro'yxatdan o'tish uchun tasdiqlash kodingiz:\n\n"
            f"```\n{result['otp']}\n```\n\n"
            f"⏱ Kod *5 daqiqa* davomida amal qiladi.\n"
            f"Bu kodni Parvona saytidagi maydoniga kiriting.",
            parse_mode='Markdown'
        )
        return

    # ── Kirish OTP oqimi ────────────────────────────────────────────────────
    if args and args[0].startswith('LOGIN_'):
        login_token = args[0][6:]
        otp, uid = await _get_login_otp(login_token)
        if not otp or not uid:
            await update.message.reply_text(
                "❌ Kirish so'rovi topilmadi yoki muddati o'tgan.\n\n"
                "Parvona saytida qaytadan urinib ko'ring."
            )
            return
        await update.message.reply_text(
            f"👋 Salom, *{tg_user.first_name}*!\n\n"
            f"🔑 *Parvona* saytiga kirish uchun tasdiqlash kodingiz:\n\n"
            f"```\n{otp}\n```\n\n"
            f"⏱ Kod *5 daqiqa* davomida amal qiladi.\n"
            f"Bu kodni Parvona saytidagi maydoniga kiriting.",
            parse_mode='Markdown'
        )
        return

    # ── Oddiy start ──────────────────────────────────────────────────────────
    user = await _get_user_by_telegram_id(tg_user.id)
    if user:
        text = f"👋 Xush kelibsiz, *{user.name}*!\n\nSizning akkauntingiz ulangan ✅"
    else:
        text = WELCOME_TEXT
    await update.message.reply_text(text, parse_mode='Markdown')


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(HELP_TEXT, parse_mode='Markdown')


async def profile_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await _get_user_by_telegram_id(update.effective_user.id)
    if not user:
        await update.message.reply_text("❌ Akkaunt ulanmagan. /connect buyrug'ini yuboring.")
        return

    role_label = {'parent': 'Ota-ona', 'nanny': 'Enaga', 'admin': 'Admin'}.get(user.role, user.role)
    text = (
        f"👤 *Profilim*\n\n"
        f"Ism: {user.name}\n"
        f"Email: {user.email}\n"
        f"Telefon: {user.phone or '—'}\n"
        f"Rol: {role_label}\n"
        f"Holat: {'✅ Faol' if user.is_active else '❌ Nofaol'}"
    )
    await update.message.reply_text(text, parse_mode='Markdown')


async def bookings_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await _get_user_by_telegram_id(update.effective_user.id)
    if not user:
        await update.message.reply_text("❌ Akkaunt ulanmagan. /connect buyrug'ini yuboring.")
        return

    bookings = await _get_active_bookings(user)
    if not bookings:
        await update.message.reply_text("📭 Faol buyurtmalar yo'q.")
        return

    status_labels = {
        'pending':   '⏳ Kutilmoqda',
        'confirmed': '✅ Tasdiqlangan',
        'active':    '🟢 Faol',
    }
    lines = ["📋 *Faol buyurtmalar:*\n"]
    for b in bookings:
        other = b.nanny.name if user == b.parent else b.parent.name
        lines.append(f"• {other} — {b.start_date} / {status_labels.get(b.status, b.status)}")
    await update.message.reply_text('\n'.join(lines), parse_mode='Markdown')


async def support_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🆘 *Yordam*\n\nMuammo yoki savollaringiz uchun:\n"
        "• 🌐 Sayt: dashboard/support\n"
        "• 📧 Email: support@parvona.uz\n\n"
        "Bot orqali murojaat qilish imkoniyati tez orada qo'shiladi.",
        parse_mode='Markdown'
    )


async def connect_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tg_id = update.effective_user.id
    existing = await _get_user_by_telegram_id(tg_id)
    if existing:
        await update.message.reply_text(
            f"✅ Akkauntingiz allaqachon ulangan!\n\nHisob: *{existing.email}*",
            parse_mode='Markdown'
        )
        return

    try:
        from django.core.cache import cache

        @sync_to_async
        def _save_token(token, tg_id):
            cache.set(f'tg_connect_{token}', tg_id, timeout=300)

        token = secrets.token_urlsafe(16)
        await _save_token(token, tg_id)
        await update.message.reply_text(
            f"🔗 *Akkaunt ulash*\n\n"
            f"Quyidagi tokenni Parvona saytida \"Profil > Telegram ulash\" bo'limiga kiriting:\n\n"
            f"`{token}`\n\n"
            f"⏱ Token 5 daqiqa davomida amal qiladi.",
            parse_mode='Markdown'
        )
    except Exception as e:
        logger.error(f'Connect error: {e}')
        await update.message.reply_text("⚠️ Xatolik. Keyinroq urinib ko'ring.")


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()


async def unknown_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "❓ Buyruq tanilmadi. Mavjud buyruqlar uchun /help yuboring."
    )


def send_notification_to_user(telegram_user_id: int, title: str, body: str):
    """Sinxron — Celery task ichidan chaqiriladi."""
    try:
        import asyncio
        from telegram import Bot
        from django.conf import settings
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not token:
            return
        bot = Bot(token=token)

        async def _send():
            await bot.send_message(
                chat_id=telegram_user_id,
                text=f"🔔 *{title}*\n\n{body}",
                parse_mode='Markdown',
            )

        asyncio.run(_send())
        logger.info(f'Telegram xabar yuborildi tg_id={telegram_user_id}')
    except Exception as e:
        logger.warning(f'Telegram xabar yuborishda xato ({telegram_user_id}): {e}')
