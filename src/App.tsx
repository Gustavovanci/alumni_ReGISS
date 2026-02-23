import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalFAB } from './components/GlobalFAB';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

// RASTREADOR DE PRESENÇA (MANTIDO)
const PresenceTracker = () => {
  useEffect(() => {
    let presenceChannel: any = null;
    let isMounted = true;

    const trackPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      presenceChannel = supabase.channel('global_presence', {
        config: { presence: { key: user.id } },
      });

      presenceChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED' && isMounted) {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });
    };

    trackPresence();

    return () => {
      isMounted = false;
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, []);

  return null;
};

// COMPONENTE DE LOADING DE TRANSIÇÃO BEM SUAVE (SKELETON GLOBAL)
const PageTransitionLoader = () => (
  <div className="min-h-screen bg-[#142239] flex flex-col items-center justify-center">
    <div className="w-12 h-12 bg-gradient-to-tr from-[#D5205D] to-[#B32F50] rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(213,32,93,0.5)] mb-4 animate-pulse">
      R
    </div>
  </div>
);

import { Auth } from './pages/Auth';
import { LandingAlumni } from './pages/LandingAlumni';
import { ForCompanies } from './pages/ForCompanies';
import { Onboarding } from './pages/Onboarding';
import { Coordination } from './pages/Coordination';
import { Feed } from './pages/Feed';
import { Network } from './pages/Network';
import { MyJourney } from './pages/MyJourney';
import { Jobs } from './pages/Jobs';
import { Events } from './pages/Events';
import { Insights } from './pages/Insights';
import { UserProfile } from './pages/UserProfile';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { CompanyDashboard } from './pages/CompanyDashboard';

// Layout do "Organismo Social" (Com Menu Lateral)
const SocialLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans selection:bg-[#D5205D]/30">
      <PresenceTracker />
      <Sidebar />
      <div className="pl-16 md:pl-20 min-h-screen relative">
        {children}
      </div>
      <GlobalFAB />
    </div>
  </ProtectedRoute>
);

// Layout do Admin (Sem menu social, visão total focada em negócio)
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="min-h-screen bg-[#0B1320] text-slate-100 font-sans selection:bg-[#D5205D]/30">
      <PresenceTracker />
      {children}
    </div>
  </ProtectedRoute>
);

function App() {
  return (
    <>
      <Toaster theme="dark" position="top-right" richColors toastOptions={{ style: { background: '#15335E', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' } }} />
      <Router>
        <Routes>
          {/* VITRINE / EXTERNO */}
          <Route path="/" element={<LandingAlumni />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/para-empresas" element={<ForCompanies />} />

          {/* ONBOARDING */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* O ORGANISMO SOCIAL (Alunos e Coordenação) */}
          <Route path="/feed" element={<SocialLayout><Feed /></SocialLayout>} />
          <Route path="/network" element={<SocialLayout><Network /></SocialLayout>} />
          <Route path="/my-journey" element={<SocialLayout><MyJourney /></SocialLayout>} />
          <Route path="/jobs" element={<SocialLayout><Jobs /></SocialLayout>} />
          <Route path="/events" element={<SocialLayout><Events /></SocialLayout>} />
          <Route path="/insights" element={<SocialLayout><Insights /></SocialLayout>} />
          <Route path="/profile/:id" element={<SocialLayout><UserProfile /></SocialLayout>} />
          <Route path="/notifications" element={<SocialLayout><Notifications /></SocialLayout>} />
          <Route path="/coordination" element={<SocialLayout><Coordination /></SocialLayout>} />

          {/* BACKOFFICE / NEGÓCIO (Isolado da rede social) */}
          <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />

          {/* PLATAFORMA B2B CORPORATIVA (Visão da Empresa) */}
          <Route path="/company" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;