from rest_framework import serializers
from .models import SupportConversation, SupportMessage
from apps.users.serializers import UserSerializer


class SupportMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model  = SupportMessage
        fields = ['id', 'sender', 'text', 'read_at', 'created_at']
        read_only_fields = ['id', 'sender', 'read_at', 'created_at']


class SupportConversationListSerializer(serializers.ModelSerializer):
    """Ro'yxat uchun — oxirgi xabar va o'qilmagan soni bilan."""
    user         = UserSerializer(read_only=True)
    admin        = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model  = SupportConversation
        fields = [
            'id', 'user', 'admin', 'subject', 'status',
            'last_message', 'unread_count', 'created_at', 'updated_at',
        ]

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if not msg:
            return None
        return {'text': msg.text, 'sender_name': msg.sender.name, 'created_at': msg.created_at}

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(read_at__isnull=True).exclude(sender=request.user).count()


class SupportConversationSerializer(serializers.ModelSerializer):
    """To'liq suhbat — xabarlar bilan."""
    user     = UserSerializer(read_only=True)
    admin    = UserSerializer(read_only=True)
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model  = SupportConversation
        fields = [
            'id', 'user', 'admin', 'subject', 'status',
            'messages', 'created_at', 'updated_at',
        ]
