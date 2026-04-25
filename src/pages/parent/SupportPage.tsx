import React, { useEffect, useRef, useState } from 'react';
import { Send, HeartHandshake, Plus, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  getMyConversations,
  getOrCreateConversation,
  getMessages,
  sendMessageRest,
  SupportSocket,
  SupportWsMessage,
  reopenConversation,
} from '../../api/support';
import { SupportConversation, SupportMessageData } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';

export default function SupportPage() {
  const { djangoUser } = useAuth();
  const [conversation, setConversation]   = useState<SupportConversation | null>(null);
  const [messages, setMessages]           = useState<SupportMessageData[]>([]);
  const [text, setText]                   = useState('');
  const [loading, setLoading]             = useState(true);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [sending, setSending]             = useState(false);
  const [wsConnected, setWsConnected]     = useState(false);
  const socketRef = useRef<SupportSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyConversations()
      .then(list => {
        const open = list.find(c => c.status === 'open') || list[0] || null;
        setConversation(open);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!conversation) return;
    setMsgLoading(true);
    getMessages(conversation.id)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));

    socketRef.current?.disconnect();
    socketRef.current = new SupportSocket(
      conversation.id,
      (msg: SupportWsMessage) => {
        setMessages(prev => [...prev, {
          id: msg.message_id,
          sender: { id: msg.sender_id, name: msg.sender_name, email: '', phone: '',
            photo: null, role: msg.sender_role as 'parent' | 'nanny' | 'admin',
            is_active: true, created_at: '',
          },
          text: msg.text,
          read_at: null,
          created_at: msg.created_at,
        }]);
      },
      () => setWsConnected(true),
    );

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setWsConnected(false);
    };
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const conv = await getOrCreateConversation('Yordam so\'rovi');
      setConversation(conv);
      setMessages([]);
    } finally {
      setLoading(false);
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleReopen = async () => {
    if (!conversation) return;
    await reopenConversation(conversation.id);
    setConversation(prev => prev ? { ...prev, status: 'open' } : prev);
  };

  const handleSend = async () => {
    if (!text.trim() || !conversation || sending) return;
    if (conversation.status === 'closed') return;
    const trimmed = text.trim();
    setText('');
    setSending(true);
    try {
      if (socketRef.current && wsConnected) {
        socketRef.current.send(trimmed);
      } else {
        const msg = await sendMessageRest(conversation.id, trimmed);
        setMessages(prev => [...prev, msg]);
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col max-h-screen">
      <PageHeader
        title="Admin bilan aloqa"
        subtitle="Savollaringizni adminga yuboring"
      />

      {!conversation ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HeartHandshake className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Yordam kerakmi?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Adminlar sizga tez orada javob berishadi. Murojaat yuboring.
            </p>
            <Button icon={<Plus className="w-4 h-4" />} onClick={handleStart}>
              Murojaat boshlash
            </Button>
          </div>
        </div>
      ) : (
        <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {conversation.admin?.name || 'Parvona Support'}
                </p>
                <p className={`text-xs font-medium ${
                  conversation.status === 'open' ? 'text-green-500' : 'text-slate-400'
                }`}>
                  {conversation.status === 'open' ? 'Ochiq' : 'Yopiq'}
                </p>
              </div>
            </div>
            {conversation.status === 'closed' && (
              <button
                onClick={handleReopen}
                className="text-xs text-purple-600 font-semibold hover:underline"
              >
                Qayta ochish
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
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <HeartHandshake className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Savolingizni yuboring, admin javob beradi.</p>
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
                        {!isMe && (
                          <p className="text-[10px] font-semibold text-purple-600 mb-1">{m.sender.name}</p>
                        )}
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
          {conversation.status === 'closed' ? (
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-slate-500">Suhbat yopilgan.</p>
              <button
                onClick={handleReopen}
                className="text-sm text-purple-600 font-semibold hover:underline ml-auto"
              >
                Qayta ochish
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-slate-100 bg-white flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Xabar yozing..."
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
        </Card>
      )}
    </div>
  );
}
