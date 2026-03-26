import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Trash2, Briefcase, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationMenu = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca inicial das notificações
  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(full_name, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Erro ao carregar notificações');
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  };

  // Marca como lida ao clicar na notificação
  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
  };

  // Clique na notificação (marca como lida + redireciona)
  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif.id);

    // Remove visualmente da lista
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));

    // Redirecionamento inteligente
    if (notif.type === 'vacancy') {
      navigate('/jobs');
    } else if (notif.type === 'event') {
      navigate('/events');
    } else if (notif.type === 'new_comment' || notif.type === 'new_like') {
      navigate('/feed');
    } else if (notif.target_url) {
      navigate(notif.target_url);
    }

    onClose();
  };

  // Deletar notificação
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const previous = [...notifications];

    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const { error } = await supabase.from('notifications').delete().eq('id', id);

    if (error) {
      setNotifications(previous);
      toast.error('Não foi possível excluir a notificação');
    }
  };

  // Carrega ao abrir o menu
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="absolute top-14 right-4 md:right-6 w-80 bg-[#15335E] border border-white/10 rounded-3xl shadow-2xl z-[100] overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#142239] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[#D5205D]" />
          <h3 className="font-bold text-white">Notificações</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X size={20} />
        </button>
      </div>

      {/* Lista */}
      <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <Bell size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">Nenhuma notificação</p>
            <p className="text-xs text-slate-500 mt-1">Tudo tranquilo por aqui.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer flex gap-4 relative group ${!notif.read ? 'bg-[#142239]/60' : ''
                }`}
            >
              {/* Ícone */}
              <div className="mt-1">
                {notif.type === 'vacancy' ? (
                  <div className="w-9 h-9 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center">
                    <Briefcase size={18} />
                  </div>
                ) : notif.type === 'event' ? (
                  <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-slate-700/50 text-slate-400 rounded-2xl flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-tight break-words">
                  {notif.content}
                </p>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Botão excluir */}
              <button
                onClick={(e) => deleteNotification(notif.id, e)}
                className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
              >
                <Trash2 size={16} />
              </button>

              {/* Bolinha não lida */}
              {!notif.read && (
                <div className="absolute top-5 right-5 w-2 h-2 bg-[#D5205D] rounded-full" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};