import hashlib
from django.conf import settings
from .base import BasePaymentProvider, PaymentSession, WebhookResult


class ClickProvider(BasePaymentProvider):
    """
    Click To'lov tizimi integratsiyasi.
    Docs: https://docs.click.uz/
    """
    CLICK_URL = 'https://my.click.uz/services/pay'

    def __init__(self):
        self.merchant_id = settings.CLICK_MERCHANT_ID
        self.service_id  = settings.CLICK_SERVICE_ID
        self.secret_key  = getattr(settings, 'CLICK_SECRET_KEY', '')

    def create_invoice(
        self,
        order_id: str,
        amount: int,
        description: str,
        callback_url: str,
        return_url: str,
    ) -> PaymentSession:
        amount_uzs = amount // 100  # tiyin → so'm

        pay_url = (
            f'{self.CLICK_URL}'
            f'?service_id={self.service_id}'
            f'&merchant_id={self.merchant_id}'
            f'&amount={amount_uzs}'
            f'&transaction_param={order_id}'
            f'&return_url={return_url}'
        )

        return PaymentSession(
            pay_url=pay_url,
            tx_id=order_id,
        )

    def parse_webhook(self, request_data: dict, headers: dict) -> WebhookResult:
        action         = request_data.get('action')
        order_id       = str(request_data.get('merchant_trans_id', ''))  # booking UUID
        provider_tx_id = str(request_data.get('click_trans_id', ''))
        amount         = int(float(request_data.get('amount', 0)) * 100)  # so'm → tiyin
        error          = request_data.get('error', 0)

        status = 'paid' if (action == 1 and error == 0) else 'failed'

        return WebhookResult(
            order_id=order_id,
            provider_tx_id=provider_tx_id,
            status=status,
            amount=amount,
            metadata=request_data,
        )

    def verify_signature(self, data: dict, headers: dict) -> bool:
        sign_string = (
            f"{data.get('click_trans_id')}"
            f"{self.service_id}"
            f"{self.secret_key}"
            f"{data.get('merchant_trans_id')}"
            f"{data.get('amount')}"
            f"{data.get('action')}"
            f"{data.get('sign_time')}"
        )
        expected = hashlib.md5(sign_string.encode()).hexdigest()
        return expected == data.get('sign_string', '')
