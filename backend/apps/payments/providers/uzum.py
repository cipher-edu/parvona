import hashlib
import hmac
import json
from django.conf import settings
from .base import BasePaymentProvider, PaymentSession, WebhookResult


class UzumProvider(BasePaymentProvider):
    """
    Uzum Bank (Apelsin) to'lov tizimi integratsiyasi.
    Docs: https://developer.uzumbank.uz/
    """
    UZUM_URL = 'https://checkout.uzumbank.uz/open-api/payments'

    def __init__(self):
        self.merchant_id = settings.UZUM_MERCHANT_ID
        self.secret_key  = settings.UZUM_SECRET_KEY
        self.service_id  = getattr(settings, 'UZUM_SERVICE_ID', '')

    def create_invoice(
        self,
        order_id: str,
        amount: int,
        description: str,
        callback_url: str,
        return_url: str,
    ) -> PaymentSession:
        params = {
            'serviceId':     self.service_id,
            'merchantId':    self.merchant_id,
            'amount':        amount,
            'orderId':       order_id,
            'returnUrl':     return_url,
            'callbackUrl':   callback_url,
            'description':   description,
        }

        # HMAC-SHA256 imzo
        sign_str = f"{self.merchant_id};{order_id};{amount}"
        signature = hmac.new(
            self.secret_key.encode(),
            sign_str.encode(),
            hashlib.sha256,
        ).hexdigest()
        params['signature'] = signature

        query = '&'.join(f'{k}={v}' for k, v in params.items())
        pay_url = f'{self.UZUM_URL}?{query}'

        return PaymentSession(
            pay_url=pay_url,
            tx_id=order_id,
        )

    def verify_signature(self, data: dict, headers: dict) -> bool:
        received_sign = headers.get('X-Uzum-Signature', '')
        order_id      = data.get('orderId', '')
        amount        = data.get('amount', 0)
        status        = data.get('status', '')

        sign_str  = f"{self.merchant_id};{order_id};{amount};{status}"
        expected  = hmac.new(
            self.secret_key.encode(),
            sign_str.encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, received_sign)

    def parse_webhook(self, request_data: dict, headers: dict) -> WebhookResult:
        if not self.verify_signature(request_data, headers):
            raise ValueError('Uzum webhook imzosi noto\'g\'ri')

        raw_status = request_data.get('status', '').upper()
        if raw_status == 'PAID':
            status = 'paid'
        elif raw_status in ('FAILED', 'DECLINED'):
            status = 'failed'
        else:
            status = 'failed'

        return WebhookResult(
            order_id=str(request_data.get('orderId', '')),
            provider_tx_id=str(request_data.get('transactionId', '')),
            status=status,
            amount=int(request_data.get('amount', 0)),
            metadata=request_data,
        )
