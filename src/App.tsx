import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalFAB } from './components/GlobalFAB';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { useStore } from './store/useStore';

// ─── LAZY LOADING COM PROTEÇÃO DE CACHE (PWA) ──────────────────────────
// Se o Vercel atualiza e o SW tenta buscar um chunk velho, ele falha e força o reload pra limpar
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Erro ao carregar página (cache velho). Atualizando app...', error);
      window.location.reload(); 
      return { default: () => <div className="min-h-screen bg-[#142239] flex items-center justify-center text-white"><Loader2 className="animate-spin text-[#D5205D] w-10 h-10" /></div> };
    }
  });

const Auth = lazyWithRetry(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const LandingAlumni = lazyWithRetry(() => import('./pages/LandingAlumni').then(m => ({ default: m.LandingAlumni })));
const ForCompanies = lazyWithRetry(() => import('./pages/ForCompanies').then(m => ({ default: m.ForCompanies })));
const Onboarding = lazyWithRetry(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Coordination = lazyWithRetry(() => import('./pages/Coordination').then(m => ({ default: m.Coordination })));
const Feed = lazyWithRetry(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const Network = lazyWithRetry(() => import('./pages/Network').then(m => ({ default: m.Network })));
const MyJourney = lazyWithRetry(() => import('./pages/MyJourney').then(m => ({ default: m.MyJourney })));
const Jobs = lazyWithRetry(() => import('./pages/Jobs').then(m => ({ default: m.Jobs })));
const Events = lazyWithRetry(() => import('./pages/Events').then(m => ({ default: m.Events })));
const Insights = lazyWithRetry(() => import('./pages/Insights').then(m => ({ default: m.Insights })));
const Communities = lazyWithRetry(() => import('./pages/Communities').then(m => ({ default: m.Communities })));
const UserProfile = lazyWithRetry(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const Notifications = lazyWithRetry(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Admin = lazyWithRetry(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const CompanyDashboard = lazyWithRetry(() => import('./pages/CompanyDashboard').then(m => ({ default: m.CompanyDashboard })));

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

  const { setAuthState } = useStore();

  // Detecção heurística de celular vs desktop (Apenas User Agent, para não acionar no PC com tela dividida)
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  useEffect(() => {
    let isMounted = true;
    let initialCheckDone = false;
    const startTime = Date.now();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      
      setSession(newSession);
      
      if (newSession) {
        // Busca a role apenas 1 vez (o onAuthStateChange dispara 'INITIAL_SESSION' no mount)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', newSession.user.id)
          .single();
          
        const role = profile?.role ?? null;
        if (isMounted) {
          setUserRole(role);
          setAuthState(newSession.user, role);
        }
      } else {
        if (isMounted) {
          setUserRole(null);
          setAuthState(null, null);
        }
      }

      // Libera a tela inicial APENAS na primeira vez que o evento for disparado
      if (!initialCheckDone && isMounted) {
        initialCheckDone = true;
        setSessionChecked(true);

        const elapsed = Date.now() - startTime;
        if (isMobile) {
          const remainingDelay = Math.max(1000 - elapsed, 0);
          setTimeout(() => {
            if (isMounted) setIsFading(true);
            setTimeout(() => {
              if (isMounted) setShowSplash(false);
            }, 600);
          }, remainingDelay);
        } else {
          setShowSplash(false);
        }
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