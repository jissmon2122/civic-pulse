import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Bell, User, LogOut, Shield, BarChart3, Map, Check } from 'lucide-react';
import { PulseLogo } from '../illustrations/PulseLogo';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isStaff, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi
        .getNotifications()
        .then((items) => setNotifications(items))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  };

  const navLinks = [
    { label: 'Explore Map', path: '/explorer', icon: <Map size={16} /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 size={16} /> },
    { label: 'Municipal Staff Portal', path: '/municipal/dashboard', icon: <Shield size={16} /> },
  ];

  if (isAdmin) {
    navLinks.push({ label: 'Admin', path: '/admin', icon: <Shield size={16} /> });
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center">
          <PulseLogo size={30} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-tint text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Staff Portal Access Badge */}
          <Link
            to="/municipal/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#8B1E3F] bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors shadow-xs"
            title="Municipal Staff & Officer Portal"
          >
            <Shield size={13} className="text-[#8B1E3F]" />
            <span>Staff Portal</span>
          </Link>

          {/* Quick Report Issue Button */}
          <Link to="/report">
            <Button
              size="sm"
              variant="primary"
              withPulse
              leftIcon={<PlusCircle size={15} />}
              className="font-semibold text-xs"
            >
              Report an Issue
            </Button>
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notifications Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-status-critical text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface rounded-2xl border border-border shadow-lifted p-3 z-50 text-left animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="font-heading font-bold text-xs text-text-primary">
                        Civic Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <Check size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/40 py-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-text-secondary py-4 text-center">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`py-2 px-1 text-xs ${!n.read_at ? 'bg-primary-tint/30 rounded-lg' : ''}`}
                          >
                            <p className="font-bold text-text-primary">{n.title}</p>
                            <p className="text-text-secondary text-[11px] mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="pt-2 border-t border-border/60 text-center">
                      <Link
                        to="/profile"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View all alerts &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl border border-border bg-surface-subtle hover:bg-surface transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-bold text-xs flex items-center justify-center">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-surface rounded-2xl border border-border shadow-lifted p-2 z-50 text-left animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-border/60">
                      <p className="font-bold text-xs text-text-primary truncate">{user?.name}</p>
                      <p className="text-[10px] text-text-secondary uppercase font-semibold">
                        Role: {user?.role}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-subtle"
                      >
                        Citizen Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-subtle"
                      >
                        Profile & Settings
                      </Link>
                      <Link
                        to="/dev/styleguide"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-surface-subtle"
                      >
                        Design Styleguide
                      </Link>
                      <Link
                        to="/municipal/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 mt-1"
                      >
                        Municipal Staff Portal &rarr;
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-border/60">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-status-critical hover:bg-status-critical-tint"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link to="/municipal/login" className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-300">
                Staff Portal
              </Link>
              <Link to="/login">
                <Button size="sm" variant="ghost" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-block">
                <Button size="sm" variant="outline" className="text-xs">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
