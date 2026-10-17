import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FolderPlus,
  History,
  Activity,
  Check,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { adminApi, apiClient } from '../api';
import { User, Category, AuditLogItem, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'audit'>('users');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // System Health
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    // Check health
    apiClient<any>('/ready')
      .then(setSystemHealth)
      .catch(() => setSystemHealth({ status: 'unreachable' }));

    loadUsers();
    loadCategories();
    loadAuditLogs();
  }, []);

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch {}
    finally {
      setIsUsersLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await adminApi.listCategories();
      setCategories(data);
    } catch {}
  };

  const loadAuditLogs = async () => {
    setIsAuditLoading(true);
    try {
      const data = await adminApi.getAuditLogs({ page: 1 });
      setAuditLogs(data);
    } catch {}
    finally {
      setIsAuditLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsAddingCat(true);
    try {
      await adminApi.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      });
      setIsCategoryModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to add category.');
    } finally {
      setIsAddingCat(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent-tint text-accent text-xs font-bold uppercase mb-2">
            <ShieldAlert size={13} />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary">
            System Governance & RBAC
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage personnel roles, civic categories, audit trails, and platform integrity.
          </p>
        </div>

        {/* System Health Status Indicator */}
        <div className="flex items-center gap-2 p-3 bg-surface border border-border rounded-xl shadow-subtle text-xs">
          <Activity size={16} className="text-status-resolved animate-pulse" />
          <div>
            <p className="font-bold text-text-primary">Database & Engine</p>
            <p className="text-[11px] text-status-resolved font-medium">
              {systemHealth?.status === 'ready' ? 'Operational & Ready' : 'Connecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users size={15} /> User & Staff Roles ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <FolderPlus size={15} /> Civic Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <History size={15} /> System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F3] border-b border-border text-text-secondary uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Promote / Demote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary">
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-text-primary">{u.name}</td>
                      <td className="py-3.5 px-4 text-text-secondary">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-resolved-tint text-status-resolved uppercase">
                          {u.account_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-status-critical-tint text-status-critical'
                              : u.role === 'staff'
                              ? 'bg-primary-tint text-primary'
                              : 'bg-surface-subtle text-text-secondary'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <select
                          value={u.role}
                          disabled={u.id === currentAdmin?.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="citizen">Citizen</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-text-secondary">
              Categories configure routing rules and AI classifier targets.
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCategoryModalOpen(true)}
              leftIcon={<Plus size={14} />}
            >
              Add New Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-text-primary">{cat.name}</h4>
                  <span className="text-[10px] uppercase font-bold text-status-resolved bg-status-resolved-tint px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {cat.description || 'Public issue reporting category.'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F3] border-b border-border text-text-secondary uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isAuditLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary">
                      Loading audit events...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-text-primary whitespace-nowrap">
                        {log.actor_name || 'System'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                        {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-text-secondary max-w-xs truncate">
                        {log.metadata_json || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Category Dialog */}
      <Dialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Civic Category"
        description="Creates an authorized category for citizens and AI classifiers."
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Street Tree Obstructions"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
          />
          <Textarea
            label="Category Description"
            placeholder="Fallen tree branches, root damage, or visibility hazards..."
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAddingCat}
              leftIcon={<Plus size={14} />}
            >
              Create Category
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
