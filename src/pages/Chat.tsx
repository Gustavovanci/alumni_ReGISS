import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, User, MoreVertical } from 'lucide-react';

type Profile = {
  id: string;
  full_name: string | null;
  profession?: string | null;
  avatar_url?: string | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
  sender?: Profile;
  receiver?: Profile;
};

export const Chat = () => {
  const { userId } = useParams(); // /chat/:userId
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Realtime channel ref (evita múltiplas inscrições)
  const channelRef = useRef<any>(null);

  const roomKey = useMemo(() => {
    if (!currentUser?.id || !activeChatUser?.id) return null;
    return [currentUser.id, activeChatUser.id].sort().join('_');
  }, [currentUser?.id, activeChatUser?.id]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cleanupChannel = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setLoading(true);
      cleanupChannel();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      if (cancelled) return;
      setCurrentUser(user);

      await loadConversations(user.id);

      if (userId) {
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('id, full_name, profession, avatar_url')
          .eq('id', userId)
          .single();

        if (targetProfile) {
          if (cancelled) return;
          setActiveChatUser(targetProfile as Profile);

          await fetchMessages(user.id, userId);
          await markThreadAsRead(user.id, userId);
          subscribeToConversation(user.id, userId);
        } else {
          setActiveChatUser(null);
          setMessages([]);
        }
      } else {
        setActiveChatUser(null);
        setMessages([]);
      }

      if (!cancelled) setLoading(false);
    };

    boot();

    return () => {
      cancelled = true;
      cleanupChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadConversations = async (myId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(
        'id, sender_id, receiver_id, content, created_at, read, deleted_by_sender, deleted_by_receiver,' +
        'sender:sender_id(id, full_name, profession, avatar_url),' +
        'receiver:receiver_id(id, full_name, profession, avatar_url)'
      )
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });

    const map = new Map<string, any>();

    (data as MessageRow[] | null)?.forEach((msg) => {
      const iAmSender = msg.sender_id === myId;

      // Soft delete: ignora mensagens que eu “apaguei”
      if (iAmSender && msg.deleted_by_sender) return;
      if (!iAmSender && msg.deleted_by_receiver) return;

      const otherUser = (iAmSender ? msg.receiver : msg.sender) as Profile | undefined;
      if (!otherUser?.id) return;

      if (!map.has(otherUser.id)) {
        map.set(otherUser.id, {
          ...otherUser,
          lastMessage: msg.content,
          date: msg.created_at,
          read: msg.read,
          sender_id: msg.sender_id,
        });
      }
    });

    setConversations(Array.from(map.values()));
  };

  const fetchMessages = async (myId: string, otherId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read, deleted_by_sender, deleted_by_receiver')
      .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
      )
      .order('created_at', { ascending: true });

    const visible = (data as MessageRow[] | null)?.filter((m) => {
      const iAmSender = m.sender_id === myId;
      if (iAmSender && m.deleted_by_sender) return false;
      if (!iAmSender && m.deleted_by_receiver) return false;
      return true;
    });

    setMessages(visible || []);
  };

  const markThreadAsRead = async (myId: string, otherId: string) => {
    // Marca como lidas apenas as mensagens recebidas por mim (e não deletadas do meu lado)
    await supabase
      .from('messages')
      .update({ read: true })
      .match({ sender_id: otherId, receiver_id: myId, read: false })
      .eq('deleted_by_receiver', false);

    // Atualiza lista lateral imediatamente
    setConversations((prev) =>
      prev.map((c) => (c.id === otherId ? { ...c, read: true } : c))
    );
  };

  const subscribeToConversation = (myId: string, otherId: string) => {
    cleanupChannel();

    const key = [myId, otherId].sort().join('_');
    const channel = supabase
      .channel(`chat_room_${key}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new as MessageRow;

          const relevant =
            (newMsg.sender_id === myId && newMsg.receiver_id === otherId) ||
            (newMsg.sender_id === otherId && newMsg.receiver_id === myId);

          if (!relevant) return;

          // Soft delete: se eu apaguei do meu lado, não re-renderiza
          const iAmSender = newMsg.sender_id === myId;
          if (iAmSender && newMsg.deleted_by_sender) return;
          if (!iAmSender && newMsg.deleted_by_receiver) return;

          setMessages((prev) => [...prev, newMsg]);

          // Se eu recebi essa msg na conversa aberta, marca como lida na hora
          if (newMsg.receiver_id === myId) {
            await supabase.from('messages').update({ read: true }).eq('id', newMsg.id);
            setConversations((prev) =>
              prev.map((c) => (c.id === otherId ? { ...c, read: true } : c))
            );
          }

          // Atualiza preview/lista
          await loadConversations(myId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        async (payload) => {
          const updated = payload.new as MessageRow;

          const relevant =
            (updated.sender_id === myId && updated.receiver_id === otherId) ||
            (updated.sender_id === otherId && updated.receiver_id === myId);

          if (!relevant) return;

          // Recarrega mensagens (para refletir delete/read)
          await fetchMessages(myId, otherId);
          await loadConversations(myId);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatUser || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChatUser.id,
      content,
    });

    if (error) {
      console.error('sendMessage error:', error);
      alert('Erro ao enviar mensagem.');
      setNewMessage(content);
      return;
    }

    await loadConversations(currentUser.id);
    // A mensagem entra na UI via realtime INSERT
  };

  const selectContact = async (contact: any) => {
    setActiveChatUser(contact);
    navigate(`/chat/${contact.id}`);
    // o useEffect do userId fará fetch/subscription/markAsRead
  };

  return (
    <div className="min-h-screen bg-regiss-dark text-slate-100 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* === COLUNA ESQUERDA: LISTA DE CONTATOS === */}
      <div className={`w-full md:w-96 border-r border-white/10 flex flex-col bg-slate-900 ${userId ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-16 border-b border-white/10 flex items-center px-4 justify-between bg-slate-900 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/feed')} className="md:hidden p-2 text-slate-400">
              <ArrowLeft />
            </button>
            <h1 className="font-bold text-lg text-white">Mensagens</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-slate-500">Carregando...</p>
          ) : (
            conversations.map((contact) => (
              <div
                key={contact.id}
                onClick={() => selectContact(contact)}
                className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex gap-3 items-center ${
                  activeChatUser?.id === contact.id ? 'bg-regiss-blue/20' : ''
                }`}
              >
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400 overflow-hidden">
                  {contact.avatar_url ? (
                    <img src={contact.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    contact.full_name?.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-white truncate">{contact.full_name}</h3>
                    <span className="text-[10px] text-slate-500">
                      {contact.date ? new Date(contact.date).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{contact.lastMessage || 'Iniciar conversa'}</p>
                </div>

                {/* bolinha de não lido (se última msg foi dele e não lida) */}
                {!contact.read && contact.sender_id !== currentUser?.id && (
                  <div className="w-2 h-2 bg-regiss-pink rounded-full shrink-0" />
                )}
              </div>
            ))
          )}

          {conversations.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
              <p>Nenhuma conversa ainda.</p>
              <button onClick={() => navigate('/network')} className="text-regiss-pink text-sm font-bold mt-2">
                Buscar alguém na Rede
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === COLUNA DIREITA: CHAT ATIVO === */}
      <div className={`flex-1 flex flex-col bg-regiss-dark ${!userId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!activeChatUser ? (
          <div className="text-center p-10 opacity-50">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-slate-500" />
            </div>
            <p>Selecione uma conversa para começar</p>
          </div>
        ) : (
          <>
            <div className="h-16 border-b border-white/10 flex items-center px-4 bg-regiss-dark/95 backdrop-blur-md sticky top-0 z-10 justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/chat')} className="md:hidden p-2 text-slate-400">
                  <ArrowLeft />
                </button>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-white overflow-hidden">
                  {activeChatUser.avatar_url ? (
                    <img src={activeChatUser.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    activeChatUser.full_name?.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-white leading-tight">{activeChatUser.full_name}</h2>
                  <p className="text-xs text-slate-400">{activeChatUser.profession}</p>
                </div>
              </div>
              <button onClick={() => navigate(`/profile/${activeChatUser.id}`)}>
                <MoreVertical className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-regiss-pink text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-pink-200' : 'text-slate-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-regiss-pink"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-regiss-pink hover:bg-pink-600 text-white p-3 rounded-xl disabled:opacity-50 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};