import React, { useState, useEffect } from 'react';
import { User, Bell, Check, LogOut, Shield, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { notificationsApi, authApi } from '../api';
import { NotificationItem } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsNotifLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch {}
    finally {
      setIsNotifLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), phone_number: phone.trim() });
      updateUser(updated);
      setSuccessMessage('Profile information saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      const updated = await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary">
          Profile & Notifications
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Manage your contact preferences and review resolution alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card (5 cols) */}
        <Card className="md:col-span-5 h-fit">
          <CardHeader>
            <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
              <User size={16} className="text-primary" />
              <span>Personal Information</span>
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {successMessage && (
              <div className="p-2.5 bg-status-resolved-tint text-xs text-status-resolved border border-status-resolved/20 rounded-xl font-medium">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-subtle border border-border rounded-xl text-xs text-text-secondary">
                  <Mail size={14} />
                  <span>{user?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Current Role
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-subtle border border-border rounded-xl text-xs font-bold text-primary uppercase">
                  <Shield size={14} />
                  <span>{user?.role}</span>
                </div>
              </div>

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 555-0101"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="w-full">
                Save Changes
              </Button>
            </form>

            <div className="pt-4 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut size={14} />}
                className="w-full text-status-critical hover:bg-status-critical-tint hover:border-status-critical/30"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications History (7 cols) */}
        <Card className="md:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <span>Resolution Updates</span>
            </h3>
            {notifications.some((n) => !n.read_at) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {isNotifLoading ? (
              <p className="text-xs text-text-secondary text-center py-8">Loading alerts...</p>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-8">
                No notifications received yet.
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      !item.read_at
                        ? 'bg-primary-tint/30 border-primary/30'
                        : 'bg-surface border-border/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-xs text-text-primary">{item.title}</p>
                      {!item.read_at && (
                        <button
                          onClick={() => handleMarkRead(item.id)}
                          className="text-[10px] text-primary hover:underline font-semibold"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{item.message}</p>
                    <span className="text-[10px] text-text-secondary/70 mt-2 block">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
