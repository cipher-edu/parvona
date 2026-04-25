from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PaymentSession:
    pay_url:    str
    tx_id:      str
    expires_at: Optional[str] = None


@dataclass
class WebhookResult:
    order_id:       str   # Bizning booking UUID (merchant_trans_id / account.order_id)
    provider_tx_id: str   # Provider ichki tranzaksiya ID
    status:         str   # 'paid' | 'failed' | 'cancelled'
    amount:         int   # tiyin
    metadata:       dict  = field(default_factory=dict)


class BasePaymentProvider(ABC):

    @abstractmethod
    def create_invoice(
        self,
        order_id: str,
        amount: int,          # tiyin
        description: str,
        callback_url: str,
        return_url: str,
    ) -> PaymentSession:
        """To'lov sahifasi URL ini yaratadi."""

    @abstractmethod
    def parse_webhook(self, request_data: dict, headers: dict) -> WebhookResult:
        """Provider callback ni parse qiladi va imzoni tekshiradi."""

    @abstractmethod
    def verify_signature(self, data: dict, headers: dict) -> bool:
        """Webhook imzosini tekshiradi."""
