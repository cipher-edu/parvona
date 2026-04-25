import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';

import { PageHeader } from '../../components/layout/PageHeader';
import { getConversations, getOrCreateConversation, getMessages, sendMessage, Conversation } from '../../api/chat';
import { useAuth } from '../../hooks/useAuth';
import { ConversationMessage } from '../../api/types';
import { tokenStorage } from '../../api/client';

const WS_BASE = import.meta.env.VITE_WS_URL
  ?? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

export default function MessagesPage() {
  const { djangoUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [messages, setMessages]               = useState<ConversationMessage[]>([]);
  const [text, setText]                       = useState('');
  const [loading, setLoading]                 = useState(true);
  const [msgLoading, setMsgLoading]           = useState(false);
  const [sending, setSending]                 = useState(false);
  const [search, setSearch]                   = useState('');
  const bottomRef                             = useRef<HTMLDivElement>(null);
  const wsRef                                 = useRef<WebSocket | null>(null);
  const inputRef                              = useRef<HTMLInputElement>(null);

  // Suhbatlar ro'yxatini yuklash + URL ?booking= param bo'yicha avtomatik tanlash
  useEffect(() => {
    const bookingParam = searchParams.get('booking');
    getConversations()
      .then(async (r) => {
        const list = r.results || [];
        setConversations(list);

        if (bookingParam) {
          const existing = list.find(c => c.booking_id === bookingParam);
          if (existing) {
            setActiveBookingId(bookingParam);
          } else {
            // Suhbat hali yo'q — backend dan yaratib olish
            try {
              const conv = await getOrCreateConversation(bookingParam);
              setConversations(prev => [conv, ...prev]);
              setActiveBookingId(bookingParam);
            } catch { /* ignore */ }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aktiv suhbat o'zgarganda xabarlarni yuklash + WebSocket
  useEffect(() => {
    if (!activeBookingId) return;

    // Eski WebSocket ni yopish
    wsRef.current?.close();
    wsRef.current = null;

    setMsgLoading(true);
    getMessages(activeBookingId)
      .then(r => setMessages(r.results || []))
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));

    // WebSocket ulanish — token URL-da emas, birinchi xabar sifatida yuboriladi
    const ws = new WebSocket(`${WS_BASE}/ws/chat/${activeBookingId}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      const token = tokenStorage.getAccess();
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'auth_ok' || data.type === 'auth_error') return;
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: data.message_id,
            sender: {
              id: data.sender_id, name: data.sender_name,
              email: '', phone: '', photo: null,
              role: 'parent', is_active: true, created_at: '',
            },
            text: data.text,
            read_at: null,
            created_at: data.created_at,
          }]);
          // Suhbat ro'yxatidagi oxirgi xabarni yangilash
          setConversations(prev => prev.map(c =>
            c.booking_id === activeBookingId
              ? { ...c, last_message: data.text, updated_at: data.created_at }
              : c,
          ));
        }
      } catch { /* ignore */ }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [activeBookingId]);

  // Pastga scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suhbat tanlash — o'qilmagan hisobni nolga tushirish
  const handleSelectConv = (bookingId: string) => {
    setActiveBookingId(bookingId);
    setConversations(prev =>
      prev.map(c => c.booking_id === bookingId ? { ...c, unread_count: 0 } : c),
    );
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Xabar yuborish
  const handleSend = async () => {
    if (!text.trim() || !activeBookingId || sending) return;
    const trimmed = text.trim();
    setText('');
    setSending(true);
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', text: trimmed }));
      } else {
        const msg = await sendMessage(activeBookingId, trimmed);
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c =>
          c.booking_id === activeBookingId
            ? { ...c, last_message: trimmed, updated_at: new Date().toISOString() }
            : c,
        ));
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageSpinner />;

  const filtered = search.trim()
    ? conversations.filter(c => c.other_user.name.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const activeConv = conversations.find(c => c.booking_id === activeBookingId);
  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col max-h-screen">
      <PageHeader
        title="Xabarlar"
        subtitle={totalUnread > 0 ? `${totalUnread} ta o'qilmagan xabar` : 'Enagalar bilan muloqot'}
      />

      <div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        {/* ── Conversations list ── */}
        <Card padding="none" className="lg:col-span-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-7 h-7" />}
              title="Xabarlar yo'q"
              description="Enaga bilan buyurtmadan so'ng muloqot boshlang"
            />
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectConv(c.booking_id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left ${
                    activeBookingId === c.booking_id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={c.other_user.photo} name={c.other_user.name} size="md" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={`text-sm truncate ${c.unread_count > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                        {c.other_user.name}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {new Date(c.updated_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${c.unread_count > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                      {c.last_message || 'Xabar yo\'q'}
                    </p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* ── Chat panel ── */}
        <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          {!activeBookingId ? (
            <EmptyState
              icon={<MessageSquare className="w-8 h-8" />}
              title="Suhbat tanlang"
              description="Chap tarafdan muloqot boshlash uchun suhbatni bosing"
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Avatar src={activeConv?.other_user.photo} name={activeConv?.other_user.name} size="md" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{activeConv?.other_user.name}</p>
                  <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-slate-50">
                {msgLoading ? (
                  <div className="flex flex-col gap-3 pt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`h-10 rounded-2xl animate-pulse bg-slate-200 ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Hali xabarlar yo'q. Birinchi xabarni yuboring!</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender.id === djangoUser?.id;
                    const showTime = idx === 0 || new Date(m.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 300_000;
                    return (
                      <React.Fragment key={m.id}>
                        {showTime && (
                          <div className="text-center py-2">
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                              {new Date(m.created_at).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <Avatar src={m.sender.photo} name={m.sender.name} size="xs" />
                          )}
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                            isMe
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                          }`}>
                            <p className="leading-relaxed">{m.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[10px] ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                                {new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && m.read_at && (
                                <span className="text-[10px] text-purple-300">✓✓</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-100 bg-white flex gap-2 items-end">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Xabar yozing..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
                />
                <Button
                  size="md"
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleSend}
                  loading={sending}
                  disabled={!text.trim()}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
