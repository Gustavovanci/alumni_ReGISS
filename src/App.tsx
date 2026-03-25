import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalFAB } from './components/GlobalFAB';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { useStore } from './store/useStore';

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
import { Communities } from './pages/Communities';
import { UserProfile } from './pages/UserProfile';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { CompanyDashboard } from './pages/CompanyDashboard';

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

// Loader minimalista para transições de rota — transparente e sem pulsação
// para a navegação parecer instantânea (chunks já estão no cache após 1º acesso)
const GentleLoader = () => (
  <div className="h-screen w-full bg-[#142239]" />
);

// Layout do "Organismo Social" (Com Menu Lateral)
const SocialLayout = () => {
  const { pathname } = useLocation();
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#142239] text-slate-100 font-sans selection:bg-[#D5205D]/30">
        <PresenceTracker />
        <Sidebar />
        <div className="pl-16 md:pl-20 min-h-screen relative">
          <Suspense fallback={<GentleLoader />}>
            {/* key no pathname garante animação de entrada a cada troca de rota */}
            <div key={pathname} className="page-enter">
              <Outlet />
            </div>
          </Suspense>
        </div>
        <GlobalFAB />
      </div>
    </ProtectedRoute>
  );
};

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

  // Detecta mobile ou PWA standalone (Android em modo instalado tem UA diferente)
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    || window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;

  useEffect(() => {
    let isMounted = true;
    let initialCheckDone = false;
    const startTime = Date.now();

    // TIMEOUT DE SEGURANÇA: Se o onAuthStateChange não disparar em 5s
    // (lock de IndexedDB/BroadcastChannel travado — causa do loading eterno no desktop),
    // força a liberação da tela para o usuário não ficar preso.
    const safetyTimer = setTimeout(() => {
      if (!initialCheckDone && isMounted) {
        console.warn('[Auth] Timeout de segurança ativado — auth não respondeu em 5s. Liberando tela.');
        initialCheckDone = true;
        setAuthState(null, null); // garante isAuthReady: true na store
        setSessionChecked(true);
        setShowSplash(false);
      }
    }, 5000);

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
        clearTimeout(safetyTimer); // auth respondeu — cancela o timeout
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
      clearTimeout(safetyTimer);
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