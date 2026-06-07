from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import NannyProfile, NannySkill, NannyAvailability, NannyDocument


VALID_SKILLS = [s.value for s in NannySkill]


class NannyProfileSerializer(serializers.ModelSerializer):
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
            'skills', 'location_name', 'latitude', 'longitude',
            'rating', 'reviews_count', 'is_verified', 'is_pro', 'status',
            'distance_km', 'created_at', 'video',
        ]
        read_only_fields = [
            'id', 'user', 'rating', 'reviews_count',
            'is_verified', 'verified_at', 'created_at',
        ]


class NannyProfileDetailSerializer(NannyProfileSerializer):
    class Meta(NannyProfileSerializer.Meta):
        fields = NannyProfileSerializer.Meta.fields + ['bio', 'updated_at']


class NannyProfileWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NannyProfile
        fields = [
            'age', 'experience', 'hourly_rate', 'bio',
            'skills', 'video', 'latitude', 'longitude', 'location_name',
            'status',
        ]

    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Ko'nikmalar ro'yxat bo'lishi kerak.")
        invalid = [s for s in value if s not in VALID_SKILLS]
        if invalid:
            raise serializers.ValidationError(f"Noto'g'ri ko'nikmalar: {invalid}")
        return value

    def validate_hourly_rate(self, value):
        if value and value < 10_000:
            raise serializers.ValidationError("Minimal soatlik narx 10,000 so'm.")
        return value


class AdminVerifyNannySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField()
    reason      = serializers.CharField(required=False, allow_blank=True)


class NannyAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = NannyAvailability
        fields = ['date', 'status']


class NannyAvailabilityWriteSerializer(serializers.Serializer):
    items = NannyAvailabilitySerializer(many=True)


class NannyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NannyDocument
        fields = [
            'id', 'doc_type', 'file', 'description',
            'status', 'review_note', 'reviewed_at', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'review_note', 'reviewed_at', 'created_at']
