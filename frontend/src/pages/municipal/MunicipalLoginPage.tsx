import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, ChevronRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TamilNaduCivicLogo } from '../../components/illustrations/TamilNaduCivicLogo';

export const MunicipalLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { municipalLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/municipal/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await municipalLogin(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your municipal credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative municipal background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <TamilNaduCivicLogo size={56} theme="dark" showText={false} />
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          Tamil Nadu Municipal Operations
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Statewide Civic Complaint Resolution &amp; Field Crew Dispatch Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold">Access Denied</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Official Staff Email
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@civicpulse.org"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#0B2545] hover:bg-[#134074] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Municipal Portal</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher for Verification & Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Evaluation &amp; Demo Staff Accounts:</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('officer@civicpulse.org', 'DemoOfficer123!')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 text-left transition-colors flex flex-col justify-between"
              >
                <span className="font-semibold text-blue-900">Municipal Officer</span>
                <span className="text-[10px] text-slate-500 mt-0.5 truncate">officer@civicpulse.org</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('worker@civicpulse.org', 'DemoWorker123!')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 text-left transition-colors flex flex-col justify-between"
              >
                <span className="font-semibold text-amber-900">Field Worker</span>
                <span className="text-[10px] text-slate-500 mt-0.5 truncate">worker@civicpulse.org</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin@civicpulse.org', 'DemoAdmin123!')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 text-left transition-colors flex flex-col justify-between"
              >
                <span className="font-semibold text-purple-900">Administrator</span>
                <span className="text-[10px] text-slate-500 mt-0.5 truncate">admin@civicpulse.org</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('staff@civicpulse.org', 'DemoStaff123!')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 text-left transition-colors flex flex-col justify-between"
              >
                <span className="font-semibold text-teal-900">General Staff</span>
                <span className="text-[10px] text-slate-500 mt-0.5 truncate">staff@civicpulse.org</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs font-medium text-teal-600 hover:text-teal-700 inline-flex items-center space-x-1"
            >
              <span>Switch to Public Citizen Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Confidential municipal system. All administrative actions and logins are logged in the audit trail.
          </p>
        </div>
      </div>
    </div>
  );
};
