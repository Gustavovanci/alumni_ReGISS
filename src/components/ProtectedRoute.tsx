import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Lê do store centralizado — ZERO chamadas ao Supabase aqui.
  // App.tsx já buscou a sessão e o role uma única vez e armazenou no store.
  const { isAuthReady, currentUser, userRole } = useStore();
  const location = useLocation();

  // Enquanto App.tsx ainda não terminou de checar a sessão, segura aqui
  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#142239]">
        <Loader2 className="w-12 h-12 text-[#D5205D] animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
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
