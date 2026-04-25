from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model  = Message
        fields = ['id', 'sender', 'text', 'read_at', 'created_at']
        read_only_fields = ['id', 'sender', 'read_at', 'created_at']


class MessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField(min_length=1, max_length=5000)


class ConversationSerializer(serializers.ModelSerializer):
    messages      = MessageSerializer(many=True, read_only=True)
    unread_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ['id', 'booking', 'messages', 'unread_count', 'created_at']

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(read_at__isnull=True).exclude(sender=user).count()


class ConversationListSerializer(serializers.ModelSerializer):
    """Suhbatlar ro'yxati uchun yengil serializer."""
    booking_id   = serializers.UUIDField(source='booking.id', read_only=True)
    other_user   = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    updated_at   = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ['id', 'booking_id', 'other_user', 'last_message', 'unread_count', 'updated_at']

    def _me(self):
        return self.context['request'].user

    def get_other_user(self, obj):
        me = self._me()
        other = obj.booking.nanny if obj.booking.parent == me else obj.booking.parent
        return {'id': str(other.id), 'name': other.name, 'photo': other.photo.url if other.photo else None}

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.text[:80] if last else ''

    def get_unread_count(self, obj):
        me = self._me()
        return obj.messages.filter(read_at__isnull=True).exclude(sender=me).count()

    def get_updated_at(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return (last.created_at if last else obj.created_at).isoformat()
