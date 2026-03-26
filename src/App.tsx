import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalFAB } from './components/GlobalFAB';
import { Toaster } from 'sonner';
import { SplashScreen } from './components/SplashScreen';
import { useStore } from './store/useStore';

import { Auth } from './pages/Auth';
import { LandingAlumni } from './pages/LandingAlumni';
import { ForCompanies } from './pages/ForCompanies';
import { Onboarding } from './pages/Onboarding';
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
import { Coordination } from './pages/Coordination';

const GentleLoader = () => <div className="min-h-screen bg-[#142239]" />;

const SocialLayout = () => {
  const { pathname } = useLocation();
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#142239] text-slate-100 font-sans">
        <Sidebar />
        <div className="pl-16 md:pl-20 min-h-screen">
          <Suspense fallback={<GentleLoader />}>
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

const AdminLayout = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-[#0B1320] text-slate-100 font-sans">
      <Suspense fallback={<GentleLoader />}>
        <Outlet />
      </Suspense>
    </div>
  </ProtectedRoute>
);

function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const { setAuthState } = useStore();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setAuthState(session.user, profile?.role || null);
      } else {
        setAuthState(null, null);
      }
      if (mounted) {
        setSessionChecked(true);
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => setShowSplash(false), 600);
        }, 800);
      }
    };

    init();
    return () => { mounted = false; };
  }, [setAuthState]);

  return (
    <>
      {showSplash && <SplashScreen isFading={isFading} />}
      <Toaster position="top-right" richColors theme="dark" />
      <Router>
        {sessionChecked && (
          <Routes>
            <Route path="/" element={<LandingAlumni />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/para-empresas" element={<ForCompanies />} />
            <Route path="/onboarding" element={<Onboarding />} />

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

            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="/company" element={<CompanyDashboard />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Router>
    </>
  );
}

export default App;