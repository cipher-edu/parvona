from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    ref_code  = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    class Meta:
        model  = User
        fields = ['email', 'name', 'phone', 'role', 'password', 'password2', 'ref_code']

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError('Admin rolini tanlash mumkin emas.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password2': 'Parollar mos kelmadi.'})
        return attrs

    def create(self, validated_data):
        ref_code = validated_data.pop('ref_code', '')
        user = User.objects.create_user(**validated_data)
        if ref_code:
            try:
                referrer = User.objects.get(referral_code=ref_code.strip().upper())
                if referrer.id != user.id:
                    user.referred_by = referrer
                    user.save(update_fields=['referred_by'])
            except User.DoesNotExist:
                pass
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT tokenga qo'shimcha claim lar qo'shish."""

    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)
        token['role']  = user.role
        token['name']  = user.name
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'email', 'name', 'phone', 'telegram_user_id',
            'photo', 'role', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'role', 'is_active', 'created_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['name', 'phone', 'photo']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Eski parol noto\'g\'ri.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class FirebaseAuthSerializer(serializers.Serializer):
    firebase_token = serializers.CharField()
    role           = serializers.ChoiceField(
        choices=['parent', 'nanny'],
        required=False,
        default='parent',
    )


class TelegramAuthSerializer(serializers.Serializer):
    """Telegram Login Widget ma'lumotlari."""
    id         = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name  = serializers.CharField(required=False, allow_blank=True, default='')
    username   = serializers.CharField(required=False, allow_blank=True, default='')
    photo_url  = serializers.CharField(required=False, allow_blank=True, default='')
    auth_date  = serializers.IntegerField()
    hash       = serializers.CharField()
    role       = serializers.ChoiceField(
        choices=['parent', 'nanny'],
        required=False,
        default='parent',
    )


class RegisterInitSerializer(serializers.Serializer):
    """Email uniqueness tekshirmasdan registratsiya ma'lumotlarini validatsiya qilish."""
    email     = serializers.EmailField()
    name      = serializers.CharField(min_length=2, max_length=150)
    phone     = serializers.CharField(required=False, allow_blank=True, max_length=20, default='')
    role      = serializers.ChoiceField(choices=[('parent', 'Parent'), ('nanny', 'Nanny')])
    password  = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    ref_code  = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_role(self, value):
        if value == 'admin':
            raise serializers.ValidationError('Admin rolini tanlash mumkin emas.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password2': 'Parollar mos kelmadi.'})
        attrs['email'] = attrs['email'].strip().lower()
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin uchun to'liq foydalanuvchi ma'lumotlari."""
    class Meta:
        model  = User
        fields = [
            'id', 'email', 'name', 'phone', 'photo',
            'role', 'is_active', 'is_staff', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
