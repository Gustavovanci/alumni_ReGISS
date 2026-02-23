import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, Heart, MessageCircle, Loader2 } from 'lucide-react';

export const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    markAllAsRead(); // Marca como lido assim que abre a página
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(full_name)') // Pega o nome de quem interagiu
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications(data || []);
    setLoading(false);
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  // Formata data
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-regiss-dark text-slate-100 font-sans">
      <nav className="sticky top-0 z-50 bg-regiss-dark/95 backdrop-blur-md border-b border-white/10 px-4 h-16 flex items-center gap-4">
        <button onClick={() => navigate('/feed')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell size={20} className="text-regiss-pink" /> Notificações
        </h1>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 text-[#D5205D] animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <Bell size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div key={notif.id} className={`p-4 rounded-xl flex gap-4 items-start border ${notif.read ? 'bg-slate-900 border-transparent' : 'bg-regiss-blue/10 border-regiss-midBlue/30'}`}>
                <div className={`mt-1 p-2 rounded-full shrink-0 ${notif.type === 'like' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'}`}>
                  {notif.type === 'like' ? <Heart size={16} /> : <MessageCircle size={16} />}
                </div>

                <div>
                  <p className="text-sm text-slate-200">
                    <span className="font-bold text-white">{notif.profiles?.full_name || 'Usuário Deletado'}</span> {notif.content}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(notif.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};