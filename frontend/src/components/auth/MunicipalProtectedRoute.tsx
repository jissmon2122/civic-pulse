import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MunicipalLayout } from '../layout/MunicipalLayout';
import { Loader2 } from 'lucide-react';

interface MunicipalProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const MunicipalProtectedRoute: React.FC<MunicipalProtectedRouteProps> = ({
  children,
  allowedRoles = ['staff', 'officer', 'field_worker', 'admin'],
}) => {
  const { user, isAuthenticated, isLoading, isMunicipal } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying municipal credentials...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or not a municipal user
  if (!isAuthenticated || !isMunicipal) {
    return <Navigate to="/municipal/login" state={{ from: location }} replace />;
  }

  // Check specific role requirement if specified
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <MunicipalLayout>
        <div className="p-8 bg-white rounded-xl border border-red-200 shadow-sm text-center">
          <h2 className="text-lg font-bold text-red-700">Unauthorized Operation</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your current municipal role (<strong>{user.role}</strong>) does not have permission to access this section.
          </p>
        </div>
      </MunicipalLayout>
    );
  }

  return <MunicipalLayout>{children}</MunicipalLayout>;
};
