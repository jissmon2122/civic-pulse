import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Shield,
  User,
  AlertTriangle,
  CheckCircle,
  FileText,
  Upload,
  Briefcase,
  PlayCircle,
  RotateCcw,
  XCircle,
  Building2,
  Brain,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { municipalApi } from '../../api';
import { MunicipalComplaint, Department, MunicipalStaff, PriorityLevel, ReportStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CivicMap } from '../../components/map/CivicMap';

export const MunicipalComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isOfficer, isFieldWorker, isAdmin } = useAuth();

  const [complaint, setComplaint] = useState<MunicipalComplaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<MunicipalStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showResolutionSubmitModal, setShowResolutionSubmitModal] = useState(false);
  const [showResolutionReviewModal, setShowResolutionReviewModal] = useState(false);

  // Form states
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyDeptId, setVerifyDeptId] = useState<number | ''>('');
  const [verifyPriority, setVerifyPriority] = useState<PriorityLevel>('MEDIUM');
  const [verifyDueDate, setVerifyDueDate] = useState('');

  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  const [assignDeptId, setAssignDeptId] = useState<number | ''>('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignPriority, setAssignPriority] = useState<PriorityLevel>('MEDIUM');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');

  const [progressNotes, setProgressNotes] = useState('');

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | 'reopen'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComplaintDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [compData, deptsData] = await Promise.all([
        municipalApi.getComplaint(id),
        municipalApi.listDepartments(),
      ]);
      setComplaint(compData);
      setDepartments(deptsData);

      // Pre-fill fields for verify/assign
      if (compData.department_id) {
        setAssignDeptId(compData.department_id);
        setVerifyDeptId(compData.department_id);
        const staffInDept = await municipalApi.listStaff(compData.department_id);
        setStaffList(staffInDept);
      } else {
        const allStaff = await municipalApi.listStaff();
        setStaffList(allStaff);
      }
      setVerifyPriority(compData.priority_level);
      setAssignPriority(compData.priority_level);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaint details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  // Load staff when assignment department changes
  const handleDepartmentChange = async (deptId: number) => {
    setAssignDeptId(deptId);
    try {
      const staffInDept = await municipalApi.listStaff(deptId);
      setStaffList(staffInDept);
      if (staffInDept.length > 0) {
        setAssignStaffId(staffInDept[0].id);
      } else {
        setAssignStaffId('');
      }
    } catch (e) {
      console.error('Failed to load staff for department', e);
    }
  };

  // 1. VERIFY COMPLAINT
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      const updated = await municipalApi.verifyComplaint(id, {
        officer_notes: verifyNotes || undefined,
        department_id: verifyDeptId ? Number(verifyDeptId) : undefined,
        priority_level: verifyPriority,
        due_date: verifyDueDate ? new Date(verifyDueDate).toISOString() : undefined,
      });
      setComplaint(updated);
      setShowVerifyModal(false);
      setActionSuccess('Complaint verified successfully and marked for resolution.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. REJECT COMPLAINT
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await municipalApi.rejectComplaint(id, {
        rejection_reason: rejectReason,
        officer_notes: rejectNotes || undefined,
      });
      setComplaint(updated);
      setShowRejectModal(false);
      setActionSuccess('Complaint marked as REJECTED with recorded justification.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. ASSIGN TASK
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !assignDeptId || !assignStaffId) {
      alert('Please select both a department and a staff member.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await municipalApi.assignComplaint(id, {
        department_id: Number(assignDeptId),
        assigned_to: assignStaffId,
        priority_level: assignPriority,
        due_date: assignDueDate ? new Date(assignDueDate).toISOString() : undefined,
        instructions: assignInstructions || undefined,
      });
      setComplaint(updated);
      setShowAssignModal(false);
      setActionSuccess('Task successfully assigned to department and crew member.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. RECORD WORK PROGRESS
  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !progressNotes.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await municipalApi.recordProgress(id, {
        progress_notes: progressNotes,
      });
      setComplaint(updated);
      setShowProgressModal(false);
      setProgressNotes('');
      setActionSuccess('Work progress logged and status updated to IN_PROGRESS.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. SUBMIT RESOLUTION EVIDENCE
  const handleResolutionEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !resolutionNotes.trim()) return;
    setIsSubmitting(true);
    try {
      const evidenceImageIds: string[] = [];
      if (evidenceFile) {
        setIsUploading(true);
        const uploadedImg = await municipalApi.uploadEvidenceImage(id, evidenceFile);
        evidenceImageIds.push(uploadedImg.id);
        setIsUploading(false);
      }

      const updated = await municipalApi.submitResolutionEvidence(id, {
        completion_notes: resolutionNotes,
        evidence_image_ids: evidenceImageIds,
      });
      setComplaint(updated);
      setShowResolutionSubmitModal(false);
      setResolutionNotes('');
      setEvidenceFile(null);
      setActionSuccess('Resolution evidence submitted! Awaiting officer review and approval.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Evidence submission failed');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // 6. REVIEW RESOLUTION
  const handleResolutionReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      const updated = await municipalApi.reviewResolution(id, {
        decision: reviewDecision,
        review_notes: reviewNotes || undefined,
      });
      setComplaint(updated);
      setShowResolutionReviewModal(false);
      setReviewNotes('');
      setActionSuccess(`Resolution review completed. Status set to: ${updated.status}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded border border-red-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded border border-orange-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">MEDIUM</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-0.5 rounded border border-slate-200">LOW</span>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1 rounded-full font-medium">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-3 py-1 rounded-full font-medium">Under Review</span>;
      case 'VERIFIED':
        return <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs px-3 py-1 rounded-full font-semibold">Verified</span>;
      case 'ASSIGNED':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-3 py-1 rounded-full font-semibold">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-3 py-1 rounded-full font-semibold">In Progress</span>;
      case 'RESOLUTION_SUBMITTED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold">Evidence Uploaded</span>;
      case 'RESOLVED':
        return <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-3 py-1 rounded-full font-bold">Resolved</span>;
      case 'REJECTED':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-1 rounded-full font-medium">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-3 py-1 rounded-full font-medium">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Retrieving complaint history and records...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Requested complaint could not be retrieved.'}</p>
        <Link
          to="/municipal/complaints"
          className="px-4 py-2 bg-[#0B2545] text-white text-xs font-semibold rounded-lg hover:bg-[#134074] transition-colors inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </Link>
      </div>
    );
  }

  const citizenImages = complaint.images.filter(img => !img.is_resolution_evidence);
  const resolutionImages = complaint.images.filter(img => img.is_resolution_evidence);

  const canVerifyOrReject = isOfficer || isAdmin;
  const canAssign = isOfficer || isAdmin;
  const canUpdateProgress = isFieldWorker || isOfficer || isAdmin;
  const canReviewResolution = isOfficer || isAdmin;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 text-green-800 text-xs font-medium animate-in fade-in">
          <Check className="w-5 h-5 text-green-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/municipal/complaints')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Back to complaints list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-[#0B2545]">{complaint.public_reference}</span>
              {getPriorityBadge(complaint.priority_level)}
              {getStatusBadge(complaint.status)}
              {complaint.is_overdue && (
                <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded">
                  OVERDUE
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{complaint.title}</h1>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center space-x-2">
          {/* Action: Verify / Reject (for SUBMITTED / UNDER_REVIEW) */}
          {canVerifyOrReject && ['SUBMITTED', 'UNDER_REVIEW'].includes(complaint.status) && (
            <>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify Issue</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </>
          )}

          {/* Action: Assign (for VERIFIED or to Reassign) */}
          {canAssign && ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-2 bg-[#0B2545] hover:bg-[#134074] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Briefcase className="w-4 h-4" />
              <span>{complaint.status === 'VERIFIED' ? 'Assign Task' : 'Reassign Work'}</span>
            </button>
          )}

          {/* Action: Progress (for ASSIGNED / IN_PROGRESS) */}
          {canUpdateProgress && ['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
            <>
              <button
                onClick={() => setShowProgressModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <PlayCircle className="w-4 h-4 text-purple-600" />
                <span>Update Progress</span>
              </button>
              <button
                onClick={() => setShowResolutionSubmitModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Submit Resolution</span>
              </button>
            </>
          )}

          {/* Action: Review Resolution (for RESOLUTION_SUBMITTED) */}
          {canReviewResolution && complaint.status === 'RESOLUTION_SUBMITTED' && (
            <button
              onClick={() => setShowResolutionReviewModal(true)}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Review &amp; Approve</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details (Left 2/3) + Case Management Sidebar (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Description & Citizen Metadata */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Citizen Report Description
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Reported By</span>
                <span className="text-slate-900 font-semibold">{complaint.reporter_name}</span>
                {complaint.reporter_email && (
                  <span className="text-slate-500 block text-[11px] truncate">{complaint.reporter_email}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Submission Timestamp</span>
                <span className="text-slate-800 font-medium">
                  {new Date(complaint.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Issue Category</span>
                <span className="text-teal-700 font-semibold">{complaint.category_name}</span>
              </div>
            </div>
          </div>

          {/* Uploaded Photographs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Incident Photographs ({citizenImages.length})</span>
            </h2>

            {citizenImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {citizenImages.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    <img
                      src={`/api/v1/reports/images/${img.storage_key}`}
                      alt={img.original_filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={`/api/v1/reports/images/${img.storage_key}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white/90 rounded-full text-slate-800 text-xs flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No photographs were attached by the reporting citizen.
              </div>
            )}

            {/* Resolution Evidence Photographs */}
            {resolutionImages.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Completion Evidence Photographs ({resolutionImages.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {resolutionImages.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-emerald-300 bg-emerald-50 aspect-video">
                      <img
                        src={`/api/v1/reports/images/${img.storage_key}`}
                        alt={img.original_filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={`/api/v1/reports/images/${img.storage_key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white/90 rounded-full text-slate-800 text-xs flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location & Map Pin */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Location Coordinates &amp; Map</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Ward / Jurisdiction</span>
                <span className="text-slate-900 font-semibold">{complaint.ward_or_area || 'General Ward'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">GPS Coordinates</span>
                <span className="font-mono text-slate-800">
                  {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                </span>
              </div>
              {complaint.location_description && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block font-medium">Address / Landmarks</span>
                  <span className="text-slate-800">{complaint.location_description}</span>
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map */}
            <div className="h-64 rounded-lg overflow-hidden border border-slate-200 mt-2">
              <CivicMap
                reports={[{
                  id: complaint.id,
                  public_reference: complaint.public_reference,
                  title: complaint.title,
                  category_name: complaint.category_name,
                  latitude: complaint.latitude,
                  longitude: complaint.longitude,
                  status: complaint.status,
                  priority_level: complaint.priority_level
                }]}
                selectedReportId={complaint.id}
                center={[complaint.latitude, complaint.longitude]}
                zoom={15}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Audit History & Status Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Auditable Status Timeline
            </h2>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
              {complaint.history && complaint.history.length > 0 ? (
                complaint.history.map((h) => (
                  <div key={h.id} className="relative flex items-start space-x-4 pl-6 text-xs">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{h.author_name || 'System Worker'}</span>
                        <span className="text-slate-400 text-[11px]">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        {h.previous_status && (
                          <>
                            <span className="font-mono text-slate-500">{h.previous_status}</span>
                            <span>→</span>
                          </>
                        )}
                        <span className="font-mono font-bold text-teal-800">{h.new_status}</span>
                      </div>
                      {h.public_comment && (
                        <p className="mt-1 text-slate-700 italic">"{h.public_comment}"</p>
                      )}
                      {h.internal_note && (
                        <p className="mt-1 text-slate-600 bg-white p-2 rounded border border-slate-200/60 font-mono text-[11px]">
                          Note: {h.internal_note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">No status updates logged yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Management & Triage Details */}
        <div className="space-y-6">
          {/* Assignment & Department Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Department &amp; Assignment</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Assigned Department</span>
                <span className="text-slate-900 font-semibold text-sm">
                  {complaint.department_name || 'Unassigned'}
                </span>
                {complaint.department_code && (
                  <span className="text-slate-400 text-[10px] font-mono ml-1">({complaint.department_code})</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Assigned Crew Member</span>
                <span className="text-slate-900 font-semibold">
                  {complaint.assignee_name || 'No worker currently assigned'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Target SLA / Due Date</span>
                <span className={`font-semibold ${complaint.is_overdue ? 'text-red-700 font-bold' : 'text-slate-900'}`}>
                  {complaint.due_date ? new Date(complaint.due_date).toLocaleDateString() : 'No Target Date Configured'}
                </span>
                {complaint.is_overdue && (
                  <span className="ml-1.5 text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
                    EXCEEDED
                  </span>
                )}
              </div>

              {complaint.active_assignment?.instructions && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-semibold block text-[11px] mb-0.5">Crew Instructions:</span>
                  <p className="text-slate-700">{complaint.active_assignment.instructions}</p>
                </div>
              )}

              {complaint.verified_by && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Verified by:</span>
                  <span className="text-teal-800 font-medium">{complaint.verifier_name || 'Municipal Officer'}</span>
                  {complaint.verified_at && (
                    <span className="text-slate-400 text-[10px] block">
                      {new Date(complaint.verified_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {complaint.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-800 font-bold block text-xs">Rejection Justification:</span>
                  <p className="text-red-700 text-xs mt-1">{complaint.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Intelligence & Priority Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>AI Triage &amp; Priority Analysis</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Calculated Priority Score:</span>
                <span className="font-mono font-bold text-base text-slate-900">
                  {complaint.priority_score.toFixed(1)} / 100
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Priority Factor Breakdown:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {complaint.priority_explanation || 'Standard civic issue prioritization algorithm applied.'}
                </p>
              </div>

              {complaint.ai_suggested_category && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block">AI Suggested Category:</span>
                  <span className="font-semibold text-slate-800">{complaint.ai_suggested_category}</span>
                  {complaint.ai_confidence && (
                    <span className="text-[11px] text-slate-400 ml-1">
                      ({(complaint.ai_confidence * 100).toFixed(0)}% confidence)
                    </span>
                  )}
                </div>
              )}

              {complaint.needs_human_review && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-semibold">Human inspection flagged by classifier</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- MODAL 1: VERIFY COMPLAINT ----------------- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <span>Verify Civic Complaint</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirming legitimacy transitions status to <strong>VERIFIED</strong> and prepares this issue for department dispatch.
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Department</label>
                <select
                  value={verifyDeptId}
                  onChange={(e) => setVerifyDeptId(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                >
                  <option value="">Select Responsible Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority Classification</label>
                <select
                  value={verifyPriority}
                  onChange={(e) => setVerifyPriority(e.target.value as PriorityLevel)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Resolution Date (Optional)</label>
                <input
                  type="date"
                  value={verifyDueDate}
                  onChange={(e) => setVerifyDueDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Officer Verification Notes</label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Record verification inspection notes, physical hazards, or special conditions..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow"
                >
                  {isSubmitting ? 'Verifying...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: REJECT COMPLAINT ----------------- */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-red-900 mb-1 flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Reject Civic Complaint</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              A mandatory justification reason must be documented for municipal audit compliance.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this complaint cannot be addressed (e.g. private property jurisdiction, invalid location, malicious/fake report)..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes (Optional)</label>
                <input
                  type="text"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Officer reference notes..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: ASSIGN TASK ----------------- */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-[#0B2545]" />
              <span>Dispatch Work Assignment</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select department, assigned crew worker, priority, and completion instructions.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsible Department <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignDeptId}
                  onChange={(e) => handleDepartmentChange(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Staff / Worker <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                >
                  <option value="">Select Crew Member...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - {s.active_assignments_count} active cases
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value as PriorityLevel)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specific Work Instructions</label>
                <textarea
                  rows={3}
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Provide instructions regarding machinery required, traffic diversion, safety measures, etc."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !assignDeptId || !assignStaffId}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Assigning...' : 'Dispatch Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 4: RECORD PROGRESS ----------------- */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-purple-600" />
              <span>Log Field Work Progress</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Records ongoing progress notes and updates status to <strong>IN_PROGRESS</strong>.
            </p>

            <form onSubmit={handleProgressSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Progress Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Detail work commenced, materials dispatched, crew on site, or intermediate steps taken..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !progressNotes.trim()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Record Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 5: SUBMIT RESOLUTION EVIDENCE ----------------- */}
      {showResolutionSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>Submit Repair &amp; Resolution Evidence</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload photographs of the completed repair and record final completion notes for municipal officer sign-off.
            </p>

            <form onSubmit={handleResolutionEvidenceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Completion Summary Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail actions taken, repairs completed, equipment used, and current condition of site..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload Post-Repair Evidence Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-700 bg-slate-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG, or WebP up to 10 MB.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowResolutionSubmitModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resolutionNotes.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {isSubmitting ? (isUploading ? 'Uploading Photo...' : 'Submitting...') : 'Submit for Officer Sign-off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 6: REVIEW RESOLUTION ----------------- */}
      {showResolutionReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-700" />
              <span>Review Work &amp; Approve Resolution</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              As an authorized officer, inspect submitted repair photographs and notes before signing off.
            </p>

            <form onSubmit={handleResolutionReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                      reviewDecision === 'approve'
                        ? 'border-green-600 bg-green-50 text-green-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={reviewDecision === 'approve'}
                      onChange={() => setReviewDecision('approve')}
                      className="sr-only"
                    />
                    Approve (RESOLVED)
                  </label>

                  <label
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                      reviewDecision === 'reject'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      checked={reviewDecision === 'reject'}
                      onChange={() => setReviewDecision('reject')}
                      className="sr-only"
                    />
                    Reject (IN_PROGRESS)
                  </label>

                  <label
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                      reviewDecision === 'reopen'
                        ? 'border-red-600 bg-red-50 text-red-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="reopen"
                      checked={reviewDecision === 'reopen'}
                      onChange={() => setReviewDecision('reopen')}
                      className="sr-only"
                    />
                    Reopen (REOPENED)
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Officer Review Comments</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record officer assessment or specific corrections required..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowResolutionReviewModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
