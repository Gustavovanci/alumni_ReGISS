import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Home,
  Users,
  Map,
  Briefcase,
  Calendar,
  BarChart2,
  MessageSquare,
  Bell,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userRole } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Busca o total de não lidas para a bolinha
  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setUnreadCount(count || 0);
  };

  // 2. Limpa o contador ao clicar (Experiência que você pediu)
  const handleNotificationClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Chama o RPC no banco para marcar como lidas
    await supabase.rpc('mark_all_notifications_as_read', { target_user_id: user.id });
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    fetchUnreadCount();

    // REALTIME: Se chegar uma vaga nova, a bolinha pula na hora
    const channel = supabase
      .channel('sidebar-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Definição dos itens do menu para não repetir código
  const menuItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/network', icon: Users, label: 'Network' },
    { path: '/my-journey', icon: Map, label: 'Minha Jornada' },
    { path: '/jobs', icon: Briefcase, label: 'Vagas' },
    { path: '/events', icon: Calendar, label: 'Eventos' },
    { path: '/insights', icon: BarChart2, label: 'Insights' },
    { path: '/communities', icon: MessageSquare, label: 'Comunidades' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-20 bg-[#15335E] border-r border-white/5 flex flex-col items-center py-6 z-50 shadow-2xl">

      {/* LOGO / HOME */}
      <div className="mb-10">
        <div className="w-10 h-10 bg-[#D5205D] rounded-xl flex items-center justify-center shadow-lg shadow-pink-900/20">
          <span className="font-black text-white text-xl">R</span>
        </div>
      </div>

      {/* MENU PRINCIPAL */}
      <nav className="flex-1 flex flex-col gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={item.label}
            className={`p-3 rounded-2xl transition-all duration-300 relative group ${pathname === item.path
                ? 'bg-[#D5205D] text-white shadow-lg shadow-pink-900/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <item.icon size={22} />
            {/* Tooltip para Desktop */}
            <span className="absolute left-20 bg-[#142239] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">
              {item.label}
            </span>
          </Link>
        ))}

        {/* SININHO COM BOLINHA VERMELHA (ESTILIZADO) */}
        <Link
          to="/notifications"
          onClick={handleNotificationClick}
          title="Notificações"
          className={`p-3 rounded-2xl transition-all duration-300 relative group ${pathname === '/notifications'
              ? 'bg-[#D5205D] text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D5205D] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#15335E] animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="absolute left-20 bg-[#142239] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">
            Notificações
          </span>
        </Link>

        {/* ADMIN / COORDENAÇÃO (Só aparece se for admin ou coord) */}
        {(userRole === 'admin' || userRole === 'coordination') && (
          <Link
            to="/coordination"
            title="Coordenação"
            className={`p-3 rounded-2xl transition-all duration-300 group relative ${pathname === '/coordination' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'
              }`}
          >
            <ShieldCheck size={22} />
            <span className="absolute left-20 bg-[#142239] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10">
              Gestão
            </span>
          </Link>
        )}
      </nav>

      {/* BOTÃO SAIR */}
      <button
        onClick={handleLogout}
        className="mt-auto p-3 text-slate-500 hover:text-red-400 transition-colors"
        title="Sair"
      >
        <LogOut size={22} />
      </button>

    </aside>
  );
};