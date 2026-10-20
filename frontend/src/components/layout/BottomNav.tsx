import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Plus, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { label: 'Home', path: isAuthenticated ? '/dashboard' : '/', icon: <Home size={20} /> },
    { label: 'Explore', path: '/explorer', icon: <Map size={20} /> },
    { label: 'Report', path: '/report', isCenter: true },
    { label: 'Alerts', path: '/profile', icon: <Bell size={20} /> },
    { label: 'Profile', path: isAuthenticated ? '/profile' : '/login', icon: <User size={20} /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-lifted pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;

          if (item.isCenter) {
            return (
              <Link
                key={idx}
                to={item.path}
                className="relative -top-4 flex flex-col items-center group select-none"
              >
                <div className="w-13 h-13 p-3 rounded-full bg-primary text-white shadow-lifted border-4 border-background flex items-center justify-center transition-transform active:scale-90 animate-pulse-subtle">
                  <Plus size={26} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-primary mt-0.5">Report</span>
              </Link>
            );
          }

          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors min-h-[44px] ${
                isActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="transition-transform active:scale-95">{item.icon}</div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
