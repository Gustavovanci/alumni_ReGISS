import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, Calendar, BarChart3, User, LogOut, Megaphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = React.useState('user');

  const isActive = (path: string) => location.pathname === path;

  // God mode para navegação irrestrita
  const isAdmin = role === 'admin';

  const menuItems = [
    ...(role === 'user' || isAdmin ? [{ icon: Home, label: 'Feed', path: '/feed' }] : []),
    ...(role === 'company' || isAdmin ? [{ icon: Briefcase, label: 'Vagas (B2B)', path: '/company' }] : []),
    ...(['user', 'coordination', 'admin'].includes(role) ? [{ icon: Users, label: 'Rede', path: '/network' }] : []),
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
    supabase.auth.getUser().then(({ data }) => {
      setRole(data?.user?.user_metadata?.role || 'user');
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-20 bg-[#142239] border-r border-white/10 flex flex-col items-center py-6 z-40 transition-all">
      <div className="relative mb-8 cursor-pointer mt-2" onClick={() => navigate('/feed')}>
        <div className="w-10 h-10 bg-gradient-to-br from-[#D5205D] to-[#B32F50] rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(213,32,93,0.5)] shrink-0 z-10 relative">
          R
        </div>
        {/* Anel Pulsante Verde indicando "Online" na Visão do Próprio Usuário */}
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#142239] shadow-[0_0_8px_rgba(34,197,94,0.8)] z-20"></div>
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full animate-ping opacity-75 z-20"></div>
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

              <span className="absolute left-16 bg-[#15335E] border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
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

            <span className="absolute left-16 bg-[#15335E] border border-amber-500/30 px-2 py-1 rounded text-[10px] font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
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
};