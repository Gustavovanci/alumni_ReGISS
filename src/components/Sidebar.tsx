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
  LogOut,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userRole, userProfile } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleNotificationClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.rpc('mark_all_notifications_as_read', { target_user_id: user.id });
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    fetchUnreadCount();

    const channel = supabase
      .channel('sidebar-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        fetchUnreadCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const menuItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/network', icon: Users, label: 'Network' },
    { path: '/my-journey', icon: Map, label: 'Minha Jornada' },
    { path: '/jobs', icon: Briefcase, label: 'Vagas' },
    { path: '/events', icon: Calendar, label: 'Eventos' },
    { path: '/insights', icon: BarChart2, label: 'Insights' },
    { path: '/communities', icon: MessageSquare, label: 'Comunidades' },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-20 bg-[#0B1320] border-r border-white/5 flex flex-col items-center py-4 z-50 shadow-2xl">

      {/* 1. ÁREA PESSOAL (Avatar e Sino - Super Compacto) */}
      <div className="flex flex-col items-center gap-2 mb-3 w-full px-2">

        {/* Avatar */}
        <Link to={`/profile/${userProfile?.id || ''}`} className="relative group block">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#15335E] to-[#1A3F70] flex items-center justify-center border-2 border-white/10 overflow-hidden transition-all duration-300 group-hover:border-[#D5205D] shadow-lg relative">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-white text-sm tracking-wider z-10">
                {getInitials(userProfile?.full_name)}
              </span>
            )}
            {/* Status Online */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0B1320] rounded-full z-20" title="Online">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
        </Link>

        {/* Sininho Único de Notificações */}
        <Link
          to="/notifications"
          onClick={handleNotificationClick}
          aria-label="Avisos"
          className={`w-full flex justify-center p-2.5 rounded-xl transition-all duration-300 relative group ${pathname === '/notifications'
              ? 'bg-gradient-to-tr from-[#D5205D] to-pink-600 text-white shadow-lg shadow-pink-900/30'
              : 'text-slate-400 hover:bg-[#D5205D]/10 hover:text-[#D5205D]'
            }`}
        >
          <Bell size={20} strokeWidth={pathname === '/notifications' ? 2.5 : 2} className="group-hover:scale-110 transition-transform duration-300" />

          {unreadCount > 0 && (
            <div className="absolute -top-1 right-2 w-4 h-4 bg-[#D5205D] text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-[#0B1320] z-10 animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}

          <span className="fixed left-16 md:left-20 ml-2 bg-[#15335E] text-slate-100 text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none transition-all duration-300 whitespace-nowrap border border-white/5 shadow-xl z-[60] group-hover:opacity-100">
            Avisos do Sistema
          </span>
        </Link>
      </div>

      {/* DIVISOR HORIZONTAL */}
      <div className="w-6 h-px bg-white/10 mb-3 shrink-0" />

      {/* 2. MENU PRINCIPAL CENTRAL */}
      <nav className="flex-1 flex flex-col gap-1.5 w-full px-2 md:px-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`w-full flex justify-center p-2.5 rounded-xl transition-all duration-300 relative group ${isActive
                  ? 'bg-gradient-to-tr from-[#D5205D] to-pink-600 text-white shadow-lg shadow-pink-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

              {/* Tooltip agora com position fixed para evitar cortes na tela */}
              <span className="fixed left-16 md:left-20 ml-2 bg-[#15335E] text-slate-100 text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none transition-all duration-300 whitespace-nowrap border border-white/5 shadow-xl z-[60] group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* COORDENAÇÃO (Só para Admin/Coord) */}
        {(userRole === 'admin' || userRole === 'coordination') && (
          <Link
            to="/coordination"
            aria-label="Gestão"
            className={`w-full flex justify-center p-2.5 rounded-xl transition-all duration-300 relative group mt-1 ${pathname === '/coordination'
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-blue-500/10 hover:text-blue-400'
              }`}
          >
            <ShieldCheck size={20} strokeWidth={pathname === '/coordination' ? 2.5 : 2} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="fixed left-16 md:left-20 ml-2 bg-[#15335E] text-slate-100 text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none transition-all duration-300 whitespace-nowrap border border-white/5 shadow-xl z-[60] group-hover:opacity-100">
              Gestão Restrita
            </span>
          </Link>
        )}
      </nav>

      {/* 3. LOGOUT FIXO NO RODAPÉ */}
      <div className="w-full px-2 md:px-3 pt-3 border-t border-white/5 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex justify-center p-2.5 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
          aria-label="Sair"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="fixed left-16 md:left-20 ml-2 bg-[#15335E] text-slate-100 text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none transition-all duration-300 whitespace-nowrap border border-white/5 shadow-xl z-[60] group-hover:opacity-100">
            Sair
          </span>
        </button>
      </div>

    </aside>
  );
};