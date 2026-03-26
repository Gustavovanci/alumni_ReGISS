import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthReady, currentUser, userRole } = useStore();
  const location = useLocation();

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

  if (userRole === 'admin') {
    return <>{children}</>;
  }

  const isCompanyRoute = location.pathname.startsWith('/company');

  if (userRole === 'company' && !isCompanyRoute) {
    return <Navigate to="/company" replace />;
  }

  if (userRole !== 'company' && isCompanyRoute) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};