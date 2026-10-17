import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  BarChart3,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  ExternalLink,
  Building2,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TamilNaduCivicLogo } from '../illustrations/TamilNaduCivicLogo';

interface MunicipalLayoutProps {
  children: React.ReactNode;
}

export const MunicipalLayout: React.FC<MunicipalLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/municipal/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Complaints',
      path: '/municipal/complaints',
      icon: ClipboardList,
    },
    {
      label: 'Assignments & Tasks',
      path: '/municipal/assignments',
      icon: Briefcase,
    },
    {
      label: 'Analytics & Reports',
      path: '/municipal/analytics',
      icon: BarChart3,
    },
    {
      label: 'Staff Profile',
      path: '/municipal/profile',
      icon: UserIcon,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/municipal/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">Admin</span>;
      case 'officer':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">Municipal Officer</span>;
      case 'field_worker':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">Field Worker</span>;
      case 'staff':
      default:
        return <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">Municipal Staff</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Government Official Header Bar */}
      <header className="bg-[#0B2545] text-white border-b border-[#134074] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Portal Badge */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="md:hidden text-slate-300 hover:text-white p-1 rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link to="/municipal/dashboard" className="flex items-center space-x-3">
                <TamilNaduCivicLogo size={36} theme="dark" showText={false} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg tracking-tight text-white">CIVIC PULSE</span>
                    <span className="hidden sm:inline-block bg-teal-900/60 text-teal-300 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-teal-500/30">
                      Tamil Nadu Municipal Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 hidden sm:block">Public Issue Management &amp; Resolution System</p>
                </div>
              </Link>
            </div>

            {/* Right: User summary, switch to citizen view, logout */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to="/"
                className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-md transition-colors"
                title="View public citizen portal"
              >
                <span>Citizen View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="h-6 w-px bg-slate-700 hidden sm:block" />

              {/* User info */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-white">{user?.name || 'Staff User'}</div>
                  <div className="text-[11px] text-slate-300">{user?.email}</div>
                </div>
                <div className="hidden sm:block">
                  {getRoleBadge(user?.role)}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-slate-300 hover:text-red-400 p-1.5 rounded-md hover:bg-white/5 transition-colors"
                  title="Sign Out of Municipal Portal"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs hidden md:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sticky top-22">
            {/* User card in sidebar */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#134074] text-white flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                  <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#134074] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                System Info
              </div>
              <div className="px-3 py-1 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="font-medium text-slate-800">Production Mode</span>
                </div>
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="font-medium text-slate-800">Civic Engine v1.0</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="bg-white w-72 h-full shadow-2xl p-5 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-teal-600" />
                    <span className="font-bold text-slate-900">Municipal Portal</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="py-4">
                  <p className="text-xs text-slate-500 mb-1">Signed in as</p>
                  <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <div className="mt-2">{getRoleBadge(user?.role)}</div>
                </div>

                <nav className="space-y-1 border-t border-slate-200 pt-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          isActive
                            ? 'bg-[#134074] text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Citizen View</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
