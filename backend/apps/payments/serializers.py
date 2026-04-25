from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Payment
        fields = [
            'id', 'booking', 'provider', 'provider_tx_id',
            'amount', 'status', 'paid_at', 'failed_at',
            'refunded_at', 'created_at',
        ]
        read_only_fields = fields


class InitiatePaymentSerializer(serializers.Serializer):
    booking_id  = serializers.UUIDField()
    provider    = serializers.ChoiceField(choices=Payment.Provider.choices)
    return_url  = serializers.URLField(required=False)

    def validate_booking_id(self, value):
        from apps.bookings.models import Booking
        try:
            booking = Booking.objects.get(
                id=value,
                parent=self.context['request'].user,
                status='confirmed',
            )
        except Booking.DoesNotExist:
            raise serializers.ValidationError('Tasdiqlangan buyurtma topilmadi.')

        if hasattr(booking, 'payment') and booking.payment.status == 'paid':
            raise serializers.ValidationError('Bu buyurtma uchun to\'lov allaqachon amalga oshirilgan.')

        self._booking = booking
        return value
