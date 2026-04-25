import hashlib
import base64
import json
import requests
from django.conf import settings
from .base import BasePaymentProvider, PaymentSession, WebhookResult


class PaymeProvider(BasePaymentProvider):
    """
    Payme Business API integratsiyasi.
    Docs: https://developer.help.paycom.uz/
    """
    PAYME_URL = 'https://checkout.paycom.uz'

    def __init__(self):
        self.merchant_id = settings.PAYME_MERCHANT_ID
        self.secret_key  = settings.PAYME_SECRET_KEY

    def create_invoice(
        self,
        order_id: str,
        amount: int,
        description: str,
        callback_url: str,
        return_url: str,
    ) -> PaymentSession:
        params = {
            'm':  self.merchant_id,
            'ac.order_id': order_id,
            'a':  amount,           # tiyin
            'l':  'uz',
            'c':  callback_url,
            'cr': return_url,
        }
        encoded = base64.b64encode(
            json.dumps(params).encode()
        ).decode()

        pay_url = f'{self.PAYME_URL}/{encoded}'

        return PaymentSession(
            pay_url=pay_url,
            tx_id=order_id,
        )

    def parse_webhook(self, request_data: dict, headers: dict) -> WebhookResult:
        method = request_data.get('method')
        params = request_data.get('params', {})

        status_map = {
            'PerformTransaction': 'paid',
            'CancelTransaction':  'failed',
            'CheckTransaction':   None,
        }

        status         = status_map.get(method, 'failed')
        amount         = params.get('amount', 0)
        # params['id']   — Payme ichki tranzaksiya ID (biz saqlaymiz)
        # account.order_id — bizning booking UUID
        provider_tx_id = str(params.get('id', ''))
        order_id       = str(params.get('account', {}).get('order_id', ''))

        return WebhookResult(
            order_id=order_id,
            provider_tx_id=provider_tx_id,
            status=status or 'paid',
            amount=amount,
            metadata=request_data,
        )

    def verify_signature(self, data: dict, headers: dict) -> bool:
        auth_header = headers.get('Authorization', '')
        if not auth_header.startswith('Basic '):
            return False
        try:
            decoded    = base64.b64decode(auth_header[6:]).decode()
            _, key     = decoded.split(':', 1)
            return key == self.secret_key
        except Exception:
            return False

    def _json_rpc_response(self, result: dict, request_id) -> dict:
        return {
            'jsonrpc': '2.0',
            'id':      request_id,
            'result':  result,
        }

    def _json_rpc_error(self, code: int, message: str, request_id) -> dict:
        return {
            'jsonrpc': '2.0',
            'id':      request_id,
            'error':   {'code': code, 'message': message},
        }
