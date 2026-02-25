import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalFAB } from './components/GlobalFAB';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';

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
const Communities = lazy(() => import('./pages/Communities').then(m => ({ default: m.Communities })));
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
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

  // Detecção heurística de celular vs desktop
  const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      const startTime = Date.now();

      // 1. O Supabase verifica se tem token armazenado
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        if (isMounted) setSession(data.session);
        // Pre-fetch da rule (Admin ou Comum ou Companhia) para roteamento nativo sem delays
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single();
        if (profile && isMounted) setUserRole(profile.role);
      }

      // 2. Agora sabemos se tem alguem logado, podemos soltar a montagem da cortina de fundo (Routes)
      if (isMounted) setSessionChecked(true);

      const elapsed = Date.now() - startTime;

      // 3. Aguarda o tempo natural de animacao e some a Splash se for celular. Se não for, fecha sumariamente.
      if (isMobile) {
        const remainingDelay = Math.max(1000 - elapsed, 0);
        setTimeout(() => {
          if (isMounted) setIsFading(true);
          setTimeout(() => {
            if (isMounted) setShowSplash(false);
          }, 600);
        }, remainingDelay);
      } else {
        if (isMounted) setShowSplash(false);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      if (newSession) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', newSession.user.id).single();
        if (profile) setUserRole(profile.role);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const getRedirectPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'company') return '/company';
    return '/feed';
  };

  return (
    <>
      {showSplash && (
        isMobile ? (
          <SplashScreen isFading={isFading} />
        ) : (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#142239]">
            <Loader2 className="w-12 h-12 text-[#D5205D] animate-spin" />
          </div>
        )
      )}
      <Toaster theme="dark" position="top-right" richColors toastOptions={{ style: { background: '#15335E', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' } }} />
      <Router>
        <Suspense fallback={<div className="min-h-screen bg-[#142239]" />}>
          {sessionChecked && (
            <Routes>
              {/* VITRINE / EXTERNO */}
              <Route path="/" element={session ? <Navigate to={getRedirectPath()} replace /> : <LandingAlumni />} />
              <Route path="/login" element={session ? <Navigate to={getRedirectPath()} replace /> : <Auth />} />
              <Route path="/para-empresas" element={<ForCompanies />} />

              {/* ONBOARDING */}
              <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<GentleLoader />}><Onboarding /></Suspense></ProtectedRoute>} />

              {/* O ORGANISMO SOCIAL (Alunos e Coordenação) */}
              <Route element={<SocialLayout />}>
                <Route path="/feed" element={<Feed />} />
                <Route path="/network" element={<Network />} />
                <Route path="/my-journey" element={<MyJourney />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/events" element={<Events />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/profile/:id" element={<UserProfile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/coordination" element={<Coordination />} />
              </Route>

              {/* BACKOFFICE / NEGÓCIO (Isolado da rede social) */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Admin />} />
              </Route>

              {/* PLATAFORMA B2B CORPORATIVA (Visão da Empresa) */}
              <Route path="/company" element={<ProtectedRoute><Suspense fallback={<GentleLoader />}><CompanyDashboard /></Suspense></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </Suspense>
      </Router>
    </>
  );
}

export default App;