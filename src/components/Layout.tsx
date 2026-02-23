import React, { useEffect } from 'react'; // Adicione useEffect
import { Sidebar } from './Sidebar';
import { ChatDock } from './ChatDock';
import { supabase } from '../lib/supabase'; // Importe supabase

export const Layout = ({ children }: { children: React.ReactNode }) => {
  
  // HEARBEAT: Atualiza "visto por último" a cada mudança de página
  useEffect(() => {
    const updatePresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);
      }
    };
    updatePresence();
  }, []);

  return (
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans selection:bg-[#D5205D]/30">
      <Sidebar />
      <div className="pl-16 md:pl-20 min-h-screen relative">
        {children}
      </div>
      <ChatDock />
    </div>
  );
};