import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Bell,
  Briefcase,
  Info,
  CheckCheck,
  Clock,
  Trash2,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Busca as notificações do usuário logado
  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar notificações:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Marca todas como lidas (para zerar a bolinha da Sidebar)
  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc('mark_all_notifications_as_read', {
      target_user_id: user.id
    });

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // 3. Deleta uma notificação específica
  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notificação removida");
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchNotifications();
      await markAllAsRead(); // Zera o contador ao abrir a página
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-[#142239] text-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="text-[#D5205D]" /> Central de <span className="text-[#D5205D]">Avisos</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Fique por dentro de vagas e mensagens do sistema</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <CheckCheck size={16} /> Marcar todas como lidas
            </button>
          )}
        </div>

        {/* LISTA DE NOTIFICAÇÕES */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-[#D5205D]" size={32} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-[#15335E]/30 border border-white/5 rounded-3xl p-16 text-center">
              <Bell size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500 font-medium">Sua caixa de entrada está vazia.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`group relative bg-[#15335E] border rounded-3xl p-5 flex items-start gap-4 transition-all duration-300 hover:border-[#D5205D]/40 ${!n.read ? 'border-[#D5205D]/30 shadow-[0_0_20px_rgba(213,32,93,0.05)]' : 'border-white/5 opacity-80'
                  }`}
              >
                {/* ÍCONE POR TIPO */}
                <div className={`p-3 rounded-2xl shrink-0 ${n.type === 'vacancy' ? 'bg-orange-500/10 text-orange-400' : 'bg-[#D5205D]/10 text-[#D5205D]'
                  }`}>
                  {n.type === 'vacancy' ? <Briefcase size={22} /> : <Info size={22} />}
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold text-base ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                      {n.title}
                    </h4>
                    {!n.read && <span className="w-2 h-2 bg-[#D5205D] rounded-full animate-pulse" />}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold tracking-widest">
                      <Clock size={12} /> {new Date(n.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {n.type === 'vacancy' && (
                      <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-bold uppercase">
                        Oportunidade
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTÃO DELETAR (Aparece no Hover) */}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="absolute top-5 right-5 p-2 text-slate-600 hover:text-red-400 transition-colors md:opacity-0 group-hover:opacity-100"
                  title="Remover notificação"
                >
                  <Trash2 size={18} />
                </button>

                {/* INDICADOR DE CLIQUE (Se houver link) */}
                {n.link_url && (
                  <ChevronRight className="absolute bottom-5 right-5 text-slate-600" size={20} />
                )}
              </div>
            ))
          )}
        </div>

        {/* FOOTER INFORMATIVO */}
        {notifications.length > 0 && (
          <p className="text-center text-slate-600 text-[10px] mt-10 uppercase tracking-[0.2em]">
            Fim das notificações recentes
          </p>
        )}
      </div>
    </div>
  );
};