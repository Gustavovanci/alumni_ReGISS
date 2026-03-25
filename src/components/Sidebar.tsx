import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, Calendar, BarChart3, User, LogOut, Megaphone, MessageSquare, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export const Sidebar = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  // Lê do store global — zero query extra, sempre sincronizado com App.tsx
  const { userRole, setAuthState } = useStore();
  const role = userRole || 'user';
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

  const isActive = (path: string) => location.pathname === path;

  // God mode para navegação irrestrita
  const isAdmin = role === 'admin';

  const menuItems = [
    ...(role === 'user' || isAdmin ? [{ icon: Home, label: 'Feed', path: '/feed' }] : []),
    ...(role === 'company' || isAdmin ? [{ icon: Briefcase, label: 'Vagas (B2B)', path: '/company' }] : []),
    ...(['user', 'coordination', 'admin'].includes(role) ? [
      { icon: Users, label: 'Rede', path: '/network' },
      { icon: MessageSquare, label: 'Fórum', path: '/communities' }
    ] : []),
    ...(role === 'user' || isAdmin ? [
      { icon: Briefcase, label: 'Vagas', path: '/jobs' },
      { icon: Calendar, label: 'Agenda', path: '/events' },
      { icon: BarChart3, label: 'Insights', path: '/insights' },
    ] : []),
    ...(['user', 'coordination', 'admin'].includes(role) ? [
      { icon: User, label: 'Perfil', path: '/my-journey' }
    ] : []),
  ];

  React.useEffect(() => {
    let channel: any;

    const fetchNotifications = async () => {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
            // Busca inicial de notificações não lidas
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', data.user.id)
                .eq('read', false);
            setUnreadNotifications(count || 0);

            // Escuta novas notificações em tempo real
            channel = supabase.channel(`sidebar_notifs_${data.user.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${data.user.id}` }, () => {
                    setUnreadNotifications(prev => prev + 1);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${data.user.id}` }, (payload) => {
                     if(payload.new.read === true) setUnreadNotifications(prev => Math.max(0, prev - 1));
                })
                .subscribe();
        }
    };
    fetchNotifications();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // Ignora erros de rede no signOut — limpa estado local de qualquer forma
    } finally {
      // Limpa a store global para garantir que não há estado preso
      setAuthState(null, null);
      navigate('/', { replace: true });
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-20 bg-[#142239] border-r border-white/10 flex flex-col items-center py-6 z-40 transition-all">
      <div className="relative mb-8 flex flex-col items-center gap-4 w-full">
          <div className="cursor-pointer mt-2 relative" onClick={() => navigate('/feed')}>
            <div className="w-10 h-10 bg-transparent flex items-center justify-center shrink-0 z-10 relative">
              <img src="/apple-touch-icon.png" alt="ReGISS" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(213,32,93,0.5)]" />
            </div>
            {/* Anel Pulsante Verde indicando "Online" na Visão do Próprio Usuário */}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#142239] shadow-[0_0_8px_rgba(34,197,94,0.8)] z-20"></div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full animate-ping opacity-75 z-20"></div>
          </div>

          <button 
              onClick={() => navigate('/notifications')}
              className={`relative p-2 rounded-xl transition-all ${isActive('/notifications') ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
              <Bell size={20} className={unreadNotifications > 0 ? "animate-bounce" : ""} />
              {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#142239]">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
              )}
          </button>
      </div>

      <nav className="flex-1 flex flex-col gap-4 w-full px-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                group relative w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-300
                ${active ? 'bg-[#D5205D] text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon size={20} className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="sr-only">{item.label}</span>

              <span className="hidden md:block absolute left-16 bg-[#15335E] border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                {item.label}
              </span>
            </button>
          );
        })}

        {role === 'coordination' && (
          <button
            onClick={() => navigate('/coordination')}
            className={`
                group relative w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-300
                ${isActive('/coordination') ? 'bg-amber-500 text-white shadow-lg' : 'text-amber-500/50 hover:bg-amber-500/10 hover:text-amber-500'}
              `}
          >
            <Megaphone size={20} className={`transition-transform ${isActive('/coordination') ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="sr-only">Área Técnica</span>

            <span className="hidden md:block absolute left-16 bg-[#15335E] border border-amber-500/30 px-2 py-1 rounded text-[10px] font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
              Área Técnica
            </span>
          </button>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto p-3 text-slate-500 hover:text-red-400 transition-colors"
        title="Sair"
      >
        <LogOut size={20} />
      </button>
    </aside>
  );
});