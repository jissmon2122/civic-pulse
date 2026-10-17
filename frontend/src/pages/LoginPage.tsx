import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, Sparkles, User, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PulseLogo } from '../components/illustrations/PulseLogo';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await login(email.trim(), password);
      if (user.role === 'staff' || user.role === 'admin') {
        navigate('/staff');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <PulseLogo size={36} />
          </Link>
          <h2 className="font-heading font-extrabold text-2xl text-text-primary">
            Sign in to Civic Pulse
          </h2>
          <p className="text-xs text-text-secondary">
            Access your civic complaints, track resolutions, or manage reports.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 bg-status-critical-tint border border-status-critical/20 rounded-xl flex items-center gap-2 text-xs text-status-critical font-medium">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-text-secondary hover:text-text-primary p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                leftIcon={<LogIn size={16} />}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div className="mt-6 pt-5 border-t border-border/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                <Sparkles size={13} className="text-accent" />
                <span>One-Click Demo Credentials</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('citizen@civicpulse.local', 'DemoCitizen123!')}
                  className="p-2 text-left rounded-xl border border-border bg-surface-subtle hover:bg-surface hover:border-primary/40 transition-colors"
                >
                  <p className="text-xs font-bold text-text-primary">Citizen</p>
                  <p className="text-[10px] text-text-secondary truncate">citizen@...</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('staff@civicpulse.local', 'DemoStaff123!')}
                  className="p-2 text-left rounded-xl border border-border bg-surface-subtle hover:bg-surface hover:border-primary/40 transition-colors"
                >
                  <p className="text-xs font-bold text-text-primary">Staff</p>
                  <p className="text-[10px] text-text-secondary truncate">staff@...</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@civicpulse.local', 'DemoAdmin123!')}
                  className="p-2 text-left rounded-xl border border-border bg-surface-subtle hover:bg-surface hover:border-primary/40 transition-colors"
                >
                  <p className="text-xs font-bold text-text-primary">Admin</p>
                  <p className="text-[10px] text-text-secondary truncate">admin@...</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-text-secondary">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register as a citizen
          </Link>
        </p>
      </div>
    </div>
  );
};
