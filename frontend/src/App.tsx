import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { SubmitReportPage } from './pages/SubmitReportPage';
import { PublicExplorerPage } from './pages/PublicExplorerPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DevStyleguidePage } from './pages/DevStyleguidePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Municipal Staff Portal Pages
import { MunicipalLoginPage } from './pages/municipal/MunicipalLoginPage';
import { MunicipalDashboardPage } from './pages/municipal/MunicipalDashboardPage';
import { MunicipalComplaintsPage } from './pages/municipal/MunicipalComplaintsPage';
import { MunicipalComplaintDetailPage } from './pages/municipal/MunicipalComplaintDetailPage';
import { MunicipalAssignmentsPage } from './pages/municipal/MunicipalAssignmentsPage';
import { MunicipalAnalyticsPage } from './pages/municipal/MunicipalAnalyticsPage';
import { MunicipalProfilePage } from './pages/municipal/MunicipalProfilePage';
import { MunicipalProtectedRoute } from './components/auth/MunicipalProtectedRoute';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireStaff?: boolean; requireAdmin?: boolean }> = ({
  children,
  requireStaff = false,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isStaff, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const location = useLocation();
  const isMunicipalRoute = location.pathname.startsWith('/municipal');

  if (isMunicipalRoute) {
    return (
      <Routes>
        <Route path="/municipal/login" element={<MunicipalLoginPage />} />
        <Route
          path="/municipal/dashboard"
          element={
            <MunicipalProtectedRoute>
              <MunicipalDashboardPage />
            </MunicipalProtectedRoute>
          }
        />
        <Route
          path="/municipal/complaints"
          element={
            <MunicipalProtectedRoute>
              <MunicipalComplaintsPage />
            </MunicipalProtectedRoute>
          }
        />
        <Route
          path="/municipal/complaints/:id"
          element={
            <MunicipalProtectedRoute>
              <MunicipalComplaintDetailPage />
            </MunicipalProtectedRoute>
          }
        />
        <Route
          path="/municipal/assignments"
          element={
            <MunicipalProtectedRoute>
              <MunicipalAssignmentsPage />
            </MunicipalProtectedRoute>
          }
        />
        <Route
          path="/municipal/analytics"
          element={
            <MunicipalProtectedRoute>
              <MunicipalAnalyticsPage />
            </MunicipalProtectedRoute>
          }
        />
        <Route
          path="/municipal/profile"
          element={
            <MunicipalProtectedRoute>
              <MunicipalProfilePage />
            </MunicipalProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary antialiased selection:bg-primary-tint selection:text-primary">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Citizen Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explorer" element={<PublicExplorerPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dev/styleguide" element={<DevStyleguidePage />} />

          {/* Authenticated Citizen Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <SubmitReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Legacy Staff & Admin Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute requireStaff>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
