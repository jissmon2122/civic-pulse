import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Lock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';

export const MunicipalProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await authApi.updateProfile({
        name,
        phone_number: phoneNumber || undefined,
      });
      updateUser(updated);
      setSuccessMsg('Profile details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold border border-purple-200">Municipal Administrator</span>;
      case 'officer':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-200">Municipal Officer</span>;
      case 'field_worker':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-200">Field Worker / Crew Member</span>;
      case 'staff':
      default:
        return <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full font-bold border border-teal-200">Municipal Operations Staff</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Account &amp; Credentials</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized personnel profile, departmental designation, security protocols, and operational role.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2 text-green-800 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Official ID Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-2xl shadow-md border-4 border-slate-100 mb-3">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

          <div className="mt-3">
            {getRoleBadge(user?.role)}
          </div>

          <div className="w-full mt-6 pt-4 border-t border-slate-100 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Account ID:</span>
              <span className="font-mono text-slate-600 text-[11px] truncate max-w-[130px]">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-green-700 capitalize">{user?.account_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registered:</span>
              <span className="text-slate-600">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full mt-6 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Right Column (2/3 width): Profile Edit Form & Security Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4">
              Edit Official Contact Details
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal / Staff Name</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Municipal Email (Read-Only)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-xs cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Official municipal emails cannot be modified self-service. Contact your systems administrator.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency / Contact Phone Number</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1-555-0100"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security Protocols Notice */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Municipal Security &amp; Compliance Policy</span>
            </div>
            <p>
              Your session is secured via cryptographically signed JWT tokens with strict role-based authorization.
              All administrative operations—including complaint verification, dispatching, rejection, and resolution sign-offs—are
              permanently recorded in the system audit log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
