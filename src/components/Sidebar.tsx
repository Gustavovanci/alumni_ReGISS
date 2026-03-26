import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Home, Briefcase, Users, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { pathname } = useLocation();

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

  const handleClearNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Chama a função SQL que criamos para zerar o contador
    await supabase.rpc('mark_all_notifications_as_read', { target_user_id: user.id });
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchUnreadCount();

    // REALTIME: Ouve novas notificações para mostrar a bolinha na hora
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-[#15335E] border-r border-white/5 flex flex-col items-center py-8 z-50">
      <div className="flex flex-col gap-8">
        {/* Ícone do Feed */}
        <Link to="/feed" className={`p-3 rounded-2xl transition-all ${pathname === '/feed' ? 'bg-[#D5205D] text-white' : 'text-slate-400 hover:bg-white/5'}`}>
          <Home size={24} />
        </Link>

        {/* ÍCONE DO SININHO COM BOLINHA E NÚMERO */}
        <Link
          to="/notifications"
          onClick={handleClearNotifications} // Ao clicar, a bolinha some
          className={`p-3 rounded-2xl transition-all relative ${pathname === '/notifications' ? 'bg-[#D5205D] text-white' : 'text-slate-400 hover:bg-white/5'}`}
        >
          <Bell size={24} />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D5205D] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#15335E] animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Outros ícones... */}
        <Link to="/jobs" className={`p-3 rounded-2xl transition-all ${pathname === '/jobs' ? 'bg-[#D5205D] text-white' : 'text-slate-400 hover:bg-white/5'}`}>
          <Briefcase size={24} />
        </Link>
      </div>
    </div>
  );
};