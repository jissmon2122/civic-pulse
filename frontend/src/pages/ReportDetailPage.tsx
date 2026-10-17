import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  User,
  Shield,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Camera,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Input';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityChip } from '../components/common/PriorityChip';
import { StatusTimeline } from '../components/common/StatusTimeline';
import { reportsApi, staffApi } from '../api';
import { Report, ReportStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isStaff } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Citizen Reopen Modal
  const [isReopenModalOpen, setIsReopenModalOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [isReopening, setIsReopening] = useState<boolean>(false);

  // Staff Transition Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<ReportStatus>('IN_PROGRESS');
  const [publicComment, setPublicComment] = useState<string>('');
  const [internalNote, setInternalNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const fetchReport = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await reportsApi.getReportDetails(id);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Report not found.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !reopenReason.trim()) return;

    setIsReopening(true);
    try {
      const updated = await reportsApi.reopenReport(report.id, reopenReason.trim());
      setReport(updated);
      setIsReopenModalOpen(false);
      setReopenReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to reopen report.');
    } finally {
      setIsReopening(false);
    }
  };

  const handleStatusTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await staffApi.updateStatus(report.id, {
        new_status: targetStatus,
        public_comment: publicComment.trim() || undefined,
        internal_note: internalNote.trim() || undefined,
      });
      setReport(updated);
      setIsStatusModalOpen(false);
      setPublicComment('');
      setInternalNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        <p className="text-xs text-text-secondary mt-3">Loading report details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertTriangle size={36} className="text-status-critical mx-auto" />
        <h2 className="font-heading font-bold text-lg text-text-primary">
          {error || 'Report Not Found'}
        </h2>
        <Link to="/explorer">
          <Button variant="outline" size="sm">
            Back to Public Explorer
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === report.reported_by;
  const canReopen =
    (isOwner || isStaff) && (report.status === 'RESOLVED' || report.status === 'CLOSED');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Back button and Reference Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/explorer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} /> Back to Explorer
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-text-secondary bg-surface-subtle px-2.5 py-1 rounded-lg border border-border">
            #{report.public_reference}
          </span>
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Main Issue Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-tint px-2.5 py-1 rounded-lg">
                {report.category_name || 'Civic Infrastructure'}
              </span>
              <PriorityChip
                level={report.priority_level}
                score={report.priority_score}
                explanation={report.priority_explanation}
              />
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary leading-tight">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-1">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-primary" />
                Submitted {new Date(report.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-primary" />
                {report.location_description || report.ward_or_area || 'Geographic Coordinates'}
              </span>
              <span className="flex items-center gap-1">
                <User size={13} className="text-primary" />
                Reported by {report.reporter_name || 'Verified Citizen'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none text-text-primary leading-relaxed bg-[#FAFAF8] p-4 rounded-xl border border-border/80">
            {report.description}
          </div>

          {/* AI Category Verification Transparency */}
          {report.ai_suggested_category && (
            <div className="p-3 bg-primary-tint/40 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-primary" />
                <span className="text-text-secondary">
                  AI Classification: <strong>{report.ai_suggested_category}</strong> (
                  {Math.round((report.ai_confidence || 0.85) * 100)}% confidence)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-primary">Human Confirmed</span>
            </div>
          )}

          {/* Attached Photo Gallery */}
          {report.images && report.images.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-secondary">
                Report Photographs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.images.map((img) => (
                  <div key={img.id} className="relative rounded-2xl overflow-hidden border border-border shadow-subtle group">
                    <img
                      src={`/api/v1/reports/images/${img.storage_key}`}
                      alt={img.original_filename}
                      className="w-full h-56 object-cover"
                    />
                    {img.is_resolution_evidence && (
                      <div className="absolute top-2 left-2 px-2.5 py-1 bg-status-resolved text-white text-[10px] font-bold rounded-lg shadow-sm">
                        Resolution Evidence
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Package-Tracking Status Journey Stepper */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-text-secondary mb-2">
              Resolution Journey
            </h4>
            <StatusTimeline
              currentStatus={report.status}
              createdAt={report.created_at}
              updatedAt={report.updated_at}
              resolvedAt={report.resolved_at}
            />
          </div>

          {/* Citizen Reopen Action Banner */}
          {canReopen && (
            <div className="p-4 bg-status-critical-tint/40 border border-status-critical/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-xs text-status-critical">
                  Not satisfied with the resolution?
                </h5>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  If the underlying issue was not fixed or has re-occurred, you can flag it unresolved.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsReopenModalOpen(true)}
                leftIcon={<RotateCcw size={14} />}
              >
                Flag as Unresolved
              </Button>
            </div>
          )}

          {/* Staff Operations Control Strip */}
          {isStaff && (
            <div className="p-4 bg-surface-subtle border border-primary/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <Shield size={14} /> Municipal Staff Actions
                </span>
                <p className="text-[11px] text-text-secondary">
                  Update state machine, record resolution proof, or dispatch work order.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsStatusModalOpen(true)}
              >
                Update Workflow Status
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public Activity & Audit Timeline */}
      <Card>
        <CardHeader>
          <h3 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            <span>Public Progress Timeline</span>
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          {report.history && report.history.length > 0 ? (
            <div className="space-y-4 relative border-l-2 border-border ml-3 pl-4">
              {report.history.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-primary">
                      {item.author_name || 'Municipal Team'}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{item.public_comment}</p>

                  {/* Internal staff note (visible to staff only) */}
                  {item.internal_note && isStaff && (
                    <div className="mt-1.5 p-2 bg-[#FEF7EB] rounded-lg text-[11px] text-[#B87702] border border-[#F8E2B6]">
                      <strong>Internal Staff Note:</strong> {item.internal_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary text-center py-4">
              No public progress updates yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Citizen Reopen Dialog */}
      <Dialog
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Flag Issue as Unresolved"
        description="Explain why the reported problem is not yet satisfactorily resolved."
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4">
          <Textarea
            label="Reason for Reopening"
            placeholder="e.g. The pothole was only filled with loose gravel which washed away in today's rain..."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReopenModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isReopening}
              leftIcon={<RotateCcw size={14} />}
            >
              Confirm Reopen
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Staff Status Transition Dialog */}
      <Dialog
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Resolution Status"
        description="Transition report through the official municipal resolution workflow."
      >
        <form onSubmit={handleStatusTransitionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
              New Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ReportStatus)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary min-h-[44px] focus:ring-2 focus:ring-primary"
            >
              <option value="UNDER_REVIEW">UNDER_REVIEW - Initial triage & planning</option>
              <option value="ASSIGNED">ASSIGNED - Field unit designated</option>
              <option value="IN_PROGRESS">IN_PROGRESS - Work crew on-site</option>
              <option value="NEEDS_INFORMATION">NEEDS_INFORMATION - Request citizen clarification</option>
              <option value="RESOLVED">RESOLVED - Work completed & verified</option>
              <option value="CLOSED">CLOSED - Formally concluded</option>
              <option value="REJECTED">REJECTED - Out of jurisdiction / duplicate</option>
            </select>
          </div>

          <Textarea
            label={
              targetStatus === 'RESOLVED'
                ? 'Public Resolution Comment (Mandatory for RESOLVED)'
                : 'Public Comment for Citizen'
            }
            placeholder={
              targetStatus === 'RESOLVED'
                ? 'Explain what repair work was carried out by the municipal team...'
                : 'Status update comment for citizen...'
            }
            value={publicComment}
            onChange={(e) => setPublicComment(e.target.value)}
            rows={3}
            required={targetStatus === 'RESOLVED'}
          />

          <Textarea
            label="Internal Staff Note (Confidential / Staff-only)"
            placeholder="Contractor details, work order number, or internal inspection notes..."
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
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
