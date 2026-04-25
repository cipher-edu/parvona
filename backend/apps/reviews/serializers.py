from rest_framework import serializers
from apps.users.serializers import UserSerializer
from apps.bookings.models import Booking
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    target = UserSerializer(read_only=True)

    class Meta:
        model  = Review
        fields = [
            'id', 'booking', 'author', 'target',
            'rating', 'text', 'created_at',
        ]
        read_only_fields = ['id', 'author', 'target', 'created_at']


class ReviewCreateSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField()
    rating     = serializers.IntegerField(min_value=1, max_value=5)
    text       = serializers.CharField(min_length=10, max_length=2000)

    def validate_booking_id(self, value):
        request = self.context['request']
        try:
            booking = Booking.objects.get(
                id=value,
                status='completed',
            )
        except Booking.DoesNotExist:
            raise serializers.ValidationError('Yakunlangan buyurtma topilmadi.')

        # Faqat aloqador tomonlar sharh qoldira oladi
        if request.user not in (booking.parent, booking.nanny):
            raise serializers.ValidationError('Bu buyurtmaga kirish huquqi yo\'q.')

        # Allaqachon sharh qoldirganligini tekshirish
        if Review.objects.filter(booking=booking, author=request.user).exists():
            raise serializers.ValidationError('Bu buyurtma uchun allaqachon sharh qoldirgan siz.')

        self._booking = booking
        return value

    def create(self, validated_data):
        request = self.context['request']
        booking = self._booking

        # Sharh kimga qoldirilayapti
        target = booking.nanny if request.user == booking.parent else booking.parent

        return Review.objects.create(
            booking = booking,
            author  = request.user,
            target  = target,
            rating  = validated_data['rating'],
            text    = validated_data['text'],
        )
