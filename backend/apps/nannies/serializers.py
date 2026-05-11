from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import NannyProfile, NannySkill, NannyAvailability


VALID_SKILLS = [s.value for s in NannySkill]


class NannyProfileSerializer(serializers.ModelSerializer):
    """Royxat uchun - bio va video_url ham kiradi."""
    from django.utils import timezone as _tz

    user        = UserSerializer(read_only=True)
    distance_km = serializers.FloatField(read_only=True, required=False)
    is_pro      = serializers.SerializerMethodField()

    def get_is_pro(self, obj):
        from django.utils import timezone
        try:
            sub = obj.user.pro_subscription
            return sub.is_active and sub.expires_at > timezone.now()
        except Exception:
            return False

    class Meta:
        model  = NannyProfile
        fields = [
            'id', 'user', 'age', 'experience', 'hourly_rate',
            'bio', 'video_url',
            'skills', 'location_name', 'latitude', 'longitude',
            'rating', 'reviews_count', 'is_verified', 'is_pro', 'status',
            'distance_km', 'created_at',
        ]
        read_only_fields = [
            'id', 'user', 'rating', 'reviews_count',
            'is_verified', 'verified_at', 'created_at',
        ]


class NannyProfileDetailSerializer(NannyProfileSerializer):
    """Detail sahifa uchun - barcha maydonlar."""
    class Meta(NannyProfileSerializer.Meta):
        fields = NannyProfileSerializer.Meta.fields + ['updated_at']


class NannyProfileWriteSerializer(serializers.ModelSerializer):
    """Nanya oz profilini yaratish/yangilash uchun."""
    class Meta:
        model  = NannyProfile
        fields = [
            'age', 'experience', 'hourly_rate', 'bio',
            'skills', 'video_url', 'latitude', 'longitude', 'location_name',
            'status',
        ]

    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Konikmalar royxat bolishi kerak.")
        invalid = [s for s in value if s not in VALID_SKILLS]
        if invalid:
            raise serializers.ValidationError(f"Notogri konikmalar: {invalid}")
        return value

    def validate_hourly_rate(self, value):
        if value < 10_000:
            raise serializers.ValidationError("Minimal soatlik narx 10,000 som.")
        return value


class AdminVerifyNannySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField()
    reason      = serializers.CharField(required=False, allow_blank=True)


class NannyAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = NannyAvailability
        fields = ['date', 'status']


class NannyAvailabilityWriteSerializer(serializers.Serializer):
    """Bulk upsert: [{date,status}, ...]"""
    items = NannyAvailabilitySerializer(many=True)