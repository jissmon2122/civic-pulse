import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Clock,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Filter,
  ArrowRight,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityChip } from '../components/common/PriorityChip';
import { staffApi, adminApi } from '../api';
import { Report, ReportStatus, PriorityLevel, User } from '../types';
import { useAuth } from '../context/AuthContext';

export const StaffDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [workload, setWorkload] = useState<{
    unassigned_queue: number;
    my_active_cases: number;
    critical_pending: number;
  }>({ unassigned_queue: 0, my_active_cases: 0, critical_pending: 0 });
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [assignedOnly, setAssignedOnly] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | undefined>(undefined);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assignNote, setAssignNote] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Status Transition Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusTarget, setStatusTarget] = useState<ReportStatus>('IN_PROGRESS');
  const [statusComment, setStatusComment] = useState<string>('');
  const [statusInternalNote, setStatusInternalNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reps, wl, users] = await Promise.all([
        staffApi.listStaffReports({
          assigned_only: assignedOnly,
          status_filter: statusFilter,
          priority_filter: priorityFilter,
          page_size: 50,
        }),
        staffApi.getWorkload(),
        adminApi.listUsers('staff').catch(() => []),
      ]);
      setReports(reps);
      setWorkload(wl);
      setStaffUsers(users);
      if (users.length > 0) setAssigneeId(users[0].id);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assignedOnly, statusFilter, priorityFilter]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !assigneeId) return;

    setIsAssigning(true);
    try {
      await staffApi.assignReport(selectedReport.id, assigneeId, assignNote || undefined);
      setIsAssignModalOpen(false);
      setAssignNote('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign report.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setIsUpdatingStatus(true);
    try {
      await staffApi.updateStatus(selectedReport.id, {
        new_status: statusTarget,
        public_comment: statusComment || undefined,
        internal_note: statusInternalNote || undefined,
      });
      setIsStatusModalOpen(false);
      setStatusComment('');
      setStatusInternalNote('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to transition status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-tint text-primary text-xs font-bold uppercase mb-2">
            <Shield size={13} />
            <span>Municipal Staff Operations</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary">
            Workload & Triage Portal
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Operational dashboard for triage, task assignment, and resolution verification.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw size={14} />}>
          Refresh Queue
        </Button>
      </div>

      {/* Operational KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-accent flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase">Awaiting Triage</p>
            <p className="font-heading font-extrabold text-2xl text-text-primary mt-0.5">
              {workload.unassigned_queue}
            </p>
            <p className="text-[11px] text-text-secondary">Unassigned new reports</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
            <Clock size={20} />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase">My Active Cases</p>
            <p className="font-heading font-extrabold text-2xl text-primary mt-0.5">
              {workload.my_active_cases}
            </p>
            <p className="text-[11px] text-text-secondary">Assigned to your unit</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary flex items-center justify-center">
            <UserCheck size={20} />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-status-critical flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase">Critical Pending</p>
            <p className="font-heading font-extrabold text-2xl text-status-critical mt-0.5">
              {workload.critical_pending}
            </p>
            <p className="text-[11px] text-text-secondary">Life safety hazards</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-status-critical-tint text-status-critical flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </Card>
      </div>

      {/* Queue Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-text-primary">
              <input
                type="checkbox"
                checked={assignedOnly}
                onChange={(e) => setAssignedOnly(e.target.checked)}
                className="rounded text-primary focus:ring-primary h-4 w-4 border-border"
              />
              <span>Assigned to me only</span>
            </label>

            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter((e.target.value as ReportStatus) || undefined)}
              className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-primary"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={priorityFilter || ''}
              onChange={(e) => setPriorityFilter((e.target.value as PriorityLevel) || undefined)}
              className="bg-surface border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-primary"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <span className="text-text-secondary">{reports.length} Reports in operational queue</span>
        </CardContent>
      </Card>

      {/* Denser Operational Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7F3] border-b border-border text-text-secondary uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Issue Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-secondary">
                    Loading staff queue...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-secondary">
                    No reports match the current filters.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-text-primary whitespace-nowrap">
                      <Link to={`/reports/${report.id}`} className="hover:text-primary hover:underline">
                        #{report.public_reference}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        to={`/reports/${report.id}`}
                        className="font-bold text-text-primary hover:text-primary line-clamp-1"
                      >
                        {report.title}
                      </Link>
                      <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                        {report.location_description || report.ward_or_area || 'Geographic coordinate'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary">
                      {report.category_name}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityChip level={report.priority_level} score={report.priority_score} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={report.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary font-medium">
                      {report.assignee_name || (
                        <span className="text-accent italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsAssignModalOpen(true);
                        }}
                        className="text-xs py-1 px-2.5 min-h-[32px]"
                      >
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedReport(report);
                          setStatusTarget(
                            report.status === 'SUBMITTED'
                              ? 'UNDER_REVIEW'
                              : report.status === 'UNDER_REVIEW'
                              ? 'ASSIGNED'
                              : report.status === 'ASSIGNED'
                              ? 'IN_PROGRESS'
                              : 'RESOLVED'
                          );
                          setIsStatusModalOpen(true);
                        }}
                        className="text-xs py-1 px-2.5 min-h-[32px]"
                      >
                        Status
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Modal */}
      <Dialog
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Report to Staff"
        description={`Designate field personnel for report #${selectedReport?.public_reference}.`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
              Select Field Officer
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary min-h-[44px] focus:ring-2 focus:ring-primary"
            >
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Internal Assignment Instructions"
            placeholder="Work order priority, equipment requirements, depot notes..."
            value={assignNote}
            onChange={(e) => setAssignNote(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAssigning}
              leftIcon={<UserPlus size={14} />}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Status Transition Modal */}
      <Dialog
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Resolution Status"
        description={`Execute state transition for report #${selectedReport?.public_reference}.`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
              Target State
            </label>
            <select
              value={statusTarget}
              onChange={(e) => setStatusTarget(e.target.value as ReportStatus)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary min-h-[44px] focus:ring-2 focus:ring-primary"
            >
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="NEEDS_INFORMATION">NEEDS_INFORMATION</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <Textarea
            label={
              statusTarget === 'RESOLVED'
                ? 'Public Resolution Note (Required for RESOLVED)'
                : 'Public Comment'
            }
            placeholder={
              statusTarget === 'RESOLVED'
                ? 'Detail what repair was conducted...'
                : 'Comment for the reporting citizen...'
            }
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            rows={3}
            required={statusTarget === 'RESOLVED'}
          />

          <Textarea
            label="Internal Staff Note (Confidential)"
            placeholder="Contractor info, inspection log, depot receipt..."
            value={statusInternalNote}
            onChange={(e) => setStatusInternalNote(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingStatus}
              leftIcon={<CheckCircle2 size={14} />}
            >
              Commit Transition
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
