from decimal import Decimal
from rest_framework import serializers
from django.utils import timezone
from apps.users.serializers import UserSerializer
from apps.nannies.models import NannyProfile
from .models import Booking
from .pricing import calculate_price


class BookingSerializer(serializers.ModelSerializer):
    parent = UserSerializer(read_only=True)
    nanny  = UserSerializer(read_only=True)

    class Meta:
        model  = Booking
        fields = [
            'id', 'parent', 'nanny', 'status',
            'start_date', 'end_date', 'hours_per_day',
            'hourly_rate', 'total_amount', 'price_details',
            'address', 'notes', 'cancel_reason',
            'confirmed_at', 'started_at',
            'completed_at', 'cancelled_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields  # Faqat o'qish uchun


class BookingCreateSerializer(serializers.Serializer):
    nanny_id      = serializers.UUIDField()
    start_date    = serializers.DateField()
    end_date      = serializers.DateField()
    hours_per_day = serializers.DecimalField(max_digits=4, decimal_places=1, min_value=1, max_value=12)
    night_hours   = serializers.IntegerField(min_value=0, max_value=8, default=0,
                        help_text='Kunlik necha soati tunda (22:00-06:00), standart 0')
    address       = serializers.CharField(max_length=300)
    notes         = serializers.CharField(required=False, allow_blank=True, default='')
    is_trial      = serializers.BooleanField(default=False)

    def validate_nanny_id(self, value):
        try:
            profile = NannyProfile.objects.select_related('user').get(
                user_id=value,
                status='active',
                is_verified=True,
            )
        except NannyProfile.DoesNotExist:
            raise serializers.ValidationError('Bu enaga mavjud emas yoki faol emas.')
        self._nanny_profile = profile
        return value

    def validate(self, attrs):
        if attrs['start_date'] < timezone.now().date():
            raise serializers.ValidationError({'start_date': 'O\'tgan sana tanlanib bo\'lmaydi.'})
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError({'end_date': 'Tugash sanasi boshlanishdan oldin bo\'lishi mumkin emas.'})
        return attrs

    def create(self, validated_data):
        nanny_user    = self._nanny_profile.user
        nanny_profile = self._nanny_profile
        parent        = validated_data.pop('_parent')
        validated_data.pop('nanny_id')
        night_hours   = validated_data.pop('night_hours', 0)

        # Dinamik narxlash
        price_bd = calculate_price(
            hourly_rate   = nanny_profile.hourly_rate,
            hours_per_day = validated_data['hours_per_day'],
            start_date    = validated_data['start_date'],
            end_date      = validated_data['end_date'],
            night_hours   = night_hours,
        )

        is_trial = validated_data.pop('is_trial', False)

        if is_trial:
            # Sinov darsi: 1 soat, 50% chegirma, sanalar bir xil
            trial_rate = int(nanny_profile.hourly_rate * 0.5)
            return Booking.objects.create(
                parent        = parent,
                nanny         = nanny_user,
                hourly_rate   = trial_rate,
                total_amount  = trial_rate,
                price_details = {'type': 'trial', 'discount': '50%'},
                is_trial      = True,
                hours_per_day = 1,
                start_date    = validated_data['start_date'],
                end_date      = validated_data['start_date'],
                address       = validated_data.get('address', ''),
                notes         = validated_data.get('notes', ''),
            )

        return Booking.objects.create(
            parent        = parent,
            nanny         = nanny_user,
            hourly_rate   = nanny_profile.hourly_rate,
            total_amount  = price_bd.total_amount,
            price_details = price_bd.to_dict(),
            is_trial      = False,
            **validated_data,
        )


class BookingStatusSerializer(serializers.Serializer):
    status        = serializers.ChoiceField(choices=Booking.Status.choices)
    cancel_reason = serializers.CharField(required=False, allow_blank=True)


class AdminBookingSerializer(BookingSerializer):
    """Admin uchun — barcha maydonlar ko'rinadi."""
    class Meta(BookingSerializer.Meta):
        pass
