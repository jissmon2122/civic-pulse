import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PulseLogo } from '../components/illustrations/PulseLogo';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please acknowledge the civic privacy notice and terms.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await register(name.trim(), email.trim(), password, phone.trim() || undefined);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <PulseLogo size={36} />
          </Link>
          <h2 className="font-heading font-extrabold text-2xl text-text-primary">
            Citizen Registration
          </h2>
          <p className="text-xs text-text-secondary">
            Join your municipal civic resolution network to submit and track reports.
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
                label="Full Name"
                placeholder="Jane Citizen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Mobile Number (Optional)"
                type="tel"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div className="relative">
                <Input
                  label="Password (min 8 characters)"
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

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {/* Privacy Terms Acknowledgement */}
              <label className="flex items-start gap-2.5 pt-1 text-xs text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 border-border"
                />
                <span>
                  I acknowledge that Civic Pulse is a public decision-support system and agree to the
                  responsible reporting terms.
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                leftIcon={<UserPlus size={16} />}
              >
                Create Citizen Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-text-secondary">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
