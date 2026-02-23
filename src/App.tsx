import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
    <img
      src="/apple-touch-icon.png"
      alt="Carregando ReGISS..."
      className="w-16 h-16 object-contain rounded-2xl shadow-[0_0_20px_rgba(213,32,93,0.3)] mb-4 animate-[pulse_1.5s_ease-in-out_infinite]"
    />
  </div>
);

import { Auth } from './pages/Auth';
import { LandingAlumni } from './pages/LandingAlumni';
import { ForCompanies } from './pages/ForCompanies';

// Internas (Páginas Pesadas carregadas sob demanda)
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Coordination = lazy(() => import('./pages/Coordination').then(m => ({ default: m.Coordination })));
const Feed = lazy(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const Network = lazy(() => import('./pages/Network').then(m => ({ default: m.Network })));
const MyJourney = lazy(() => import('./pages/MyJourney').then(m => ({ default: m.MyJourney })));
const Jobs = lazy(() => import('./pages/Jobs').then(m => ({ default: m.Jobs })));
const Events = lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const Insights = lazy(() => import('./pages/Insights').then(m => ({ default: m.Insights })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard').then(m => ({ default: m.CompanyDashboard })));

// Loading Secundário Discreto
const GentleLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-transparent">
    <img
      src="/apple-touch-icon.png"
      alt="..."
      className="w-10 h-10 object-contain opacity-50 animate-pulse"
    />
  </div>
);

// Layout do "Organismo Social" (Com Menu Lateral)
const SocialLayout = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-[#142239] text-slate-100 font-sans selection:bg-[#D5205D]/30">
      <PresenceTracker />
      <Sidebar />
      <div className="pl-16 md:pl-20 min-h-screen relative">
        <Suspense fallback={<GentleLoader />}>
          <Outlet />
        </Suspense>
      </div>
      <GlobalFAB />
    </div>
  </ProtectedRoute>
);

// Layout do Admin (Sem menu social, visão total focada em negócio)
const AdminLayout = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-[#0B1320] text-slate-100 font-sans selection:bg-[#D5205D]/30">
      <PresenceTracker />
      <Suspense fallback={<GentleLoader />}>
        <Outlet />
      </Suspense>
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
          <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<PageTransitionLoader />}><Onboarding /></Suspense></ProtectedRoute>} />

          {/* O ORGANISMO SOCIAL (Alunos e Coordenação) */}
          <Route element={<SocialLayout />}>
            <Route path="/feed" element={<Feed />} />
            <Route path="/network" element={<Network />} />
            <Route path="/my-journey" element={<MyJourney />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/coordination" element={<Coordination />} />
          </Route>

          {/* BACKOFFICE / NEGÓCIO (Isolado da rede social) */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* PLATAFORMA B2B CORPORATIVA (Visão da Empresa) */}
          <Route path="/company" element={<ProtectedRoute><Suspense fallback={<PageTransitionLoader />}><CompanyDashboard /></Suspense></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;