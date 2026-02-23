import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SplashScreen } from './SplashScreen';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session && isMounted) {
          setIsAuthenticated(true);
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          if (profile && isMounted) setUserRole(profile.role);
        } else if (isMounted) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Initial session fetch error:', error);
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (session) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && isMounted) setUserRole(profile.role);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // God Mode: O "Dono do Produto" ignora qualquer redirecionamento restritivo
  if (userRole === 'admin') {
    return <>{children}</>;
  }

  // Cerca de Segurança B2B
  const isCompanyRoute = location.pathname.startsWith('/company');

  if (userRole === 'company' && !isCompanyRoute) {
    // Se for empresa tentando entrar na rede social
    return <Navigate to="/company" replace />;
  }

  if (userRole !== 'company' && isCompanyRoute) {
    // Se for aluno/coordenador tentando entrar no portal B2B isolado
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};
