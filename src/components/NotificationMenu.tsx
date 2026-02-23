import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Trash2, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationMenu = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) console.error("Erro ao buscar notificações:", error);
    setNotifications(data || []);
    setLoading(false);
  };

  const handleNotificationClick = async (notif: any) => {
    // 1. Marca como lido visualmente
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
    );

    // 2. Salva no banco de dados e verifica erro
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notif.id);

    if (error) {
      console.error("Erro ao marcar como lido:", error);
    }

    // 3. Redirecionamento baseado no tipo
    if (notif.type === 'vacancy') {
      navigate('/jobs');
      onClose();
    } else if (notif.type === 'event') {
      navigate('/events');
      onClose();
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique dispare a abertura da notificação

    // Salva o estado atual caso dê erro
    const previousNotifications = [...notifications];

    // Remove visualmente primeiro (pra ser rápido na tela)
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Deleta no banco
    const { error } = await supabase.from('notifications').delete().eq('id', id);

    if (error) {
      console.error("Erro ao deletar notificação:", error);
      // Se deu erro no banco, devolve a notificação para a tela e avisa o usuário
      setNotifications(previousNotifications);
      toast.error("Erro ao excluir. Tente novamente.");
    }
  };

  return (
    <div className="absolute top-12 right-0 w-80 bg-[#15335E] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
      {/* HEADER DO MENU */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#142239]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell size={16} className="text-[#D5205D]" /> Notificações
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-1 rounded-md hover:bg-white/10">
          <X size={16} />
        </button>
      </div>

      {/* LISTA DE NOTIFICAÇÕES */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-[#15335E]">
        {loading ? (
          <p className="text-center py-6 text-xs text-slate-500 font-medium">Carregando...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Bell size={32} className="text-slate-600 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-bold text-slate-400">Tudo limpo por aqui</p>
            <p className="text-xs text-slate-500 mt-1">Você não tem novas notificações.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all group relative cursor-pointer flex gap-3 ${notif.read ? 'opacity-60 bg-transparent' : 'bg-[#142239]/40'
                }`}
              onClick={() => handleNotificationClick(notif)}
            >
              {/* ÍCONE DE STATUS */}
              {!notif.read && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#D5205D]"></div>
              )}

              {/* ÍCONE CONTEXTUAL */}
              <div className="mt-1 shrink-0">
                {notif.type === 'vacancy' ? (
                  <div className="w-8 h-8 rounded-full bg-[#D5205D]/20 text-[#D5205D] flex items-center justify-center"><Briefcase size={14} /></div>
                ) : notif.type === 'event' ? (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Calendar size={14} /></div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700/50 text-slate-400 flex items-center justify-center"><Bell size={14} /></div>
                )}
              </div>

              <div className="flex-1 pr-6">
                <p className="text-xs text-white leading-relaxed">
                  {notif.profiles?.full_name && <span className="font-bold">{notif.profiles.full_name} </span>}
                  {notif.content}
                </p>
                <span className="text-[10px] text-slate-500 mt-1.5 block font-medium uppercase tracking-wider">
                  {new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* BOTÃO EXCLUIR */}
              <button
                onClick={(e) => deleteNotification(notif.id, e)}
                className="absolute bottom-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-[#142239] rounded-md border border-white/5"
                title="Apagar notificação"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};