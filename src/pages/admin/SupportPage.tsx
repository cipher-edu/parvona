import React, { useEffect, useRef, useState } from 'react';
import { Send, HeartHandshake, Search, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  getMyConversations,
  getMessages,
  sendMessageRest,
  closeConversation,
  SupportSocket,
  SupportWsMessage,
} from '../../api/support';
import { SupportConversation, SupportMessageData } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';

export default function AdminSupportPage() {
  const { djangoUser } = useAuth();
  const [conversations, setConversations]   = useState<SupportConversation[]>([]);
  const [activeId, setActiveId]             = useState<string | null>(null);
  const [messages, setMessages]             = useState<SupportMessageData[]>([]);
  const [text, setText]                     = useState('');
  const [search, setSearch]                 = useState('');
  const [loading, setLoading]               = useState(true);
  const [msgLoading, setMsgLoading]         = useState(false);
  const [sending, setSending]               = useState(false);
  const [wsConnected, setWsConnected]       = useState(false);
  const socketRef = useRef<SupportSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setMsgLoading(true);
    getMessages(activeId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));

    socketRef.current?.disconnect();
    socketRef.current = new SupportSocket(
      activeId,
      (msg: SupportWsMessage) => {
        setMessages(prev => [...prev, {
          id: msg.message_id,
          sender: {
            id: msg.sender_id, name: msg.sender_name, email: '', phone: '',
            photo: null, role: msg.sender_role as 'parent' | 'nanny' | 'admin',
            is_active: true, created_at: '',
          },
          text: msg.text,
          read_at: null,
          created_at: msg.created_at,
        }]);
        setConversations(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, last_message: { text: msg.text, sender_name: msg.sender_name, created_at: msg.created_at }, unread_count: 0 }
            : c,
        ));
      },
      () => setWsConnected(true),
    );

    // O'qilmagan hisobni nolga tushirish
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unread_count: 0 } : c));

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setWsConnected(false);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConv = (id: string) => {
    setActiveId(id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!text.trim() || !activeId || sending) return;
    const conv = conversations.find(c => c.id === activeId);
    if (conv?.status === 'closed') return;
    const trimmed = text.trim();
    setText('');
    setSending(true);
    try {
      if (socketRef.current && wsConnected) {
        socketRef.current.send(trimmed);
      } else {
        const msg = await sendMessageRest(activeId, trimmed);
        setMessages(prev => [...prev, msg]);
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const handleClose = async (id: string) => {
    await closeConversation(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'closed' } : c));
  };

  if (loading) return <PageSpinner />;

  const activeConv = conversations.find(c => c.id === activeId);
  const filtered = search.trim()
    ? conversations.filter(c =>
        c.user.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col max-h-screen">
      <PageHeader
        title="Yordam xizmati"
        subtitle={totalUnread > 0 ? `${totalUnread} ta o'qilmagan murojaat` : 'Foydalanuvchilarning murojaatlari'}
      />

      <div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        {/* ── Conversation list ── */}
        <Card padding="none" className="lg:col-span-1 flex flex-col overflow-hidden">
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
              icon={<HeartHandshake className="w-7 h-7" />}
              title="Murojaatlar yo'q"
              description="Hozircha foydalanuvchilardan murojaat kelmagan"
            />
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectConv(c.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left ${
                    activeId === c.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                  }`}
                >
                  <Avatar src={c.user.photo} name={c.user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <p className={`text-sm truncate ${c.unread_count > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                        {c.user.name}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(c.updated_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{c.subject}</p>
                    <p className={`text-xs truncate mt-0.5 ${c.unread_count > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                      {c.last_message?.text || 'Xabar yo\'q'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.unread_count > 0 && (
                      <span className="bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {c.unread_count}
                      </span>
                    )}
                    <Badge
                      variant={c.status === 'open' ? 'success' : 'default'}
                      size="sm"
                    >
                      {c.status === 'open' ? 'Ochiq' : 'Yopiq'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* ── Chat panel ── */}
        <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          {!activeId ? (
            <EmptyState
              icon={<HeartHandshake className="w-8 h-8" />}
              title="Murojaatni tanlang"
              description="Chap tarafdan foydalanuvchi murojaatini tanlang"
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <Avatar src={activeConv?.user.photo} name={activeConv?.user.name} size="md" />
                  <div>
                    <p className="font-semibold text-slate-900">{activeConv?.user.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {activeConv?.user.role === 'nanny' ? 'Enaga' : 'Ota-ona'} · {activeConv?.subject}
                    </p>
                  </div>
                </div>
                {activeConv?.status === 'open' && (
                  <button
                    onClick={() => handleClose(activeId)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Yopish
                  </button>
                )}
              </div>

              {/* Messages */}
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
                  <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                    <HeartHandshake className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Hali xabarlar yo'q.</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender.id === djangoUser?.id;
                    const showTime = idx === 0 ||
                      new Date(m.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 300_000;
                    return (
                      <React.Fragment key={m.id}>
                        {showTime && (
                          <div className="text-center py-2">
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                              {new Date(m.created_at).toLocaleString('uz-UZ', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
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
                              {isMe && m.read_at && <span className="text-[10px] text-purple-300">✓✓</span>}
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
              {activeConv?.status === 'closed' ? (
                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 text-center">
                  <p className="text-sm text-slate-500">Suhbat yopilgan.</p>
                </div>
              ) : (
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Javob yozing..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                  <Button
                    size="md"
                    icon={<Send className="w-4 h-4" />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={!text.trim()}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
