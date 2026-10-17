import { apiClient } from './client';
export { apiClient };
import {
  User,
  Report,
  Category,
  ReportImage,
  ClassifyResult,
  DuplicateCandidate,
  PriorityResult,
  NotificationItem,
  OverviewAnalytics,
  CategoryStat,
  StatusStat,
  AreaStat,
  Hotspot,
  AuditLogItem,
  UserRole,
  ReportStatus,
  PriorityLevel,
  Department,
  MunicipalStaff,
  MunicipalComplaint,
  MunicipalAssignment,
  MunicipalDashboardStats
} from '../types';

// ---------------- AUTH API ----------------
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone_number?: string }) =>
    apiClient<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiClient<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => apiClient<User>('/auth/me'),

  updateProfile: (data: { name?: string; phone_number?: string }) =>
    apiClient<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ---------------- REPORTS API ----------------
export const reportsApi = {
  listPublicReports: (params: {
    search?: string;
    category_id?: number;
    status?: ReportStatus;
    priority_level?: PriorityLevel;
    ward_or_area?: string;
    page?: number;
    page_size?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.category_id) q.append('category_id', params.category_id.toString());
    if (params.status) q.append('status', params.status);
    if (params.priority_level) q.append('priority_level', params.priority_level);
    if (params.ward_or_area) q.append('ward_or_area', params.ward_or_area);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    return apiClient<Report[]>(`/reports?${q.toString()}`);
  },

  getMapReports: (params: { category_id?: number; status?: ReportStatus; ward_or_area?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.category_id) q.append('category_id', params.category_id.toString());
    if (params.status) q.append('status', params.status);
    if (params.ward_or_area) q.append('ward_or_area', params.ward_or_area);
    return apiClient<Array<{
      id: string;
      public_reference: string;
      title: string;
      category_id: number;
      category_name: string;
      latitude: number;
      longitude: number;
      status: ReportStatus;
      priority_level: PriorityLevel;
      created_at: string;
    }>>(`/reports/map?${q.toString()}`);
  },

  getMyReports: () => apiClient<Report[]>('/reports/me'),

  getReportDetails: (id: string) => apiClient<Report>(`/reports/${id}`),

  createReport: (data: {
    title: string;
    description: string;
    category_id: number;
    latitude: number;
    longitude: number;
    location_description?: string;
    ward_or_area?: string;
    ai_suggested_category?: string;
    ai_confidence?: number;
  }) =>
    apiClient<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadImage: (reportId: string, file: File, isResolutionEvidence: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<ReportImage>(
      `/reports/${reportId}/images?is_resolution_evidence=${isResolutionEvidence}`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  reopenReport: (reportId: string, reason: string) =>
    apiClient<Report>(`/reports/${reportId}/reopen?reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
    }),
};

// ---------------- AI API ----------------
export const aiApi = {
  classify: (title: string, description: string) =>
    apiClient<ClassifyResult>('/ai/classify', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  checkDuplicates: (data: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    category_id?: number;
    radius_meters?: number;
  }) =>
    apiClient<{ total_candidates_analyzed: number; duplicate_matches: DuplicateCandidate[] }>(
      '/ai/duplicates/check',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  explainPriority: (data: {
    title: string;
    description: string;
    category_name: string;
    created_at?: string;
    duplicate_count?: number;
  }) =>
    apiClient<PriorityResult>('/ai/priority/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEvaluationMetrics: () => apiClient<any>('/ai/metrics'),
};

// ---------------- STAFF API ----------------
export const staffApi = {
  listStaffReports: (params: {
    assigned_only?: boolean;
    status_filter?: ReportStatus;
    priority_filter?: PriorityLevel;
    page?: number;
    page_size?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.assigned_only) q.append('assigned_only', 'true');
    if (params.status_filter) q.append('status_filter', params.status_filter);
    if (params.priority_filter) q.append('priority_filter', params.priority_filter);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    return apiClient<Report[]>(`/staff/reports?${q.toString()}`);
  },

  updateStatus: (
    reportId: string,
    data: {
      new_status: ReportStatus;
      public_comment?: string;
      internal_note?: string;
      resolution_evidence_key?: string;
    }
  ) =>
    apiClient<Report>(`/staff/reports/${reportId}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  assignReport: (reportId: string, assignedToUserId: string, note?: string) =>
    apiClient<Report>(`/staff/reports/${reportId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to_user_id: assignedToUserId, note }),
    }),

  getWorkload: () =>
    apiClient<{
      unassigned_queue: number;
      my_active_cases: number;
      critical_pending: number;
    }>('/staff/workload'),
};

// ---------------- ADMIN API ----------------
export const adminApi = {
  listUsers: (role?: UserRole) => {
    const q = role ? `?role=${role}` : '';
    return apiClient<User[]>(`/admin/users${q}`);
  },

  updateUserRole: (userId: string, role: UserRole) =>
    apiClient<User>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  listCategories: () => apiClient<Category[]>('/admin/categories'),

  createCategory: (data: {
    name: string;
    description?: string;
    icon_name?: string;
    color_hint?: string;
  }) =>
    apiClient<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAuditLogs: (params: { action?: string; entity_type?: string; page?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.action) q.append('action', params.action);
    if (params.entity_type) q.append('entity_type', params.entity_type);
    if (params.page) q.append('page', params.page.toString());
    return apiClient<AuditLogItem[]>(`/admin/audit-logs?${q.toString()}`);
  },
};

export const categoriesApi = {
  list: () => apiClient<Category[]>('/admin/categories'),
};

// ---------------- ANALYTICS API ----------------
export const analyticsApi = {
  getOverview: () => apiClient<OverviewAnalytics>('/analytics/overview'),
  getCategories: () => apiClient<CategoryStat[]>('/analytics/categories'),
  getStatusDistribution: () => apiClient<StatusStat[]>('/analytics/status'),
  getAreas: () => apiClient<AreaStat[]>('/analytics/areas'),
  getHotspots: () => apiClient<{ total_hotspots: number; hotspots: Hotspot[] }>('/analytics/hotspots'),
};

// ---------------- NOTIFICATIONS API ----------------
export const notificationsApi = {
  getNotifications: () => apiClient<NotificationItem[]>('/notifications'),
  markAsRead: (id: number) => apiClient<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiClient<{ message: string }>('/notifications/read-all', { method: 'POST' }),
};

// ---------------- MUNICIPAL PORTAL API ----------------
export const municipalApi = {
  login: (data: { email: string; password: string }) =>
    apiClient<{ access_token: string; user: User }>('/municipal/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDashboard: () => apiClient<MunicipalDashboardStats>('/municipal/dashboard'),

  listComplaints: (params: {
    search?: string;
    status?: ReportStatus;
    category_id?: number;
    priority_level?: PriorityLevel;
    department_id?: number;
    assigned_to?: string;
    ward_or_area?: string;
    is_overdue?: boolean;
    from_date?: string;
    to_date?: string;
    sort_by?: string;
    sort_dir?: string;
    page?: number;
    page_size?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.status) q.append('status', params.status);
    if (params.category_id) q.append('category_id', params.category_id.toString());
    if (params.priority_level) q.append('priority_level', params.priority_level);
    if (params.department_id) q.append('department_id', params.department_id.toString());
    if (params.assigned_to) q.append('assigned_to', params.assigned_to);
    if (params.ward_or_area) q.append('ward_or_area', params.ward_or_area);
    if (params.is_overdue !== undefined) q.append('is_overdue', params.is_overdue.toString());
    if (params.from_date) q.append('from_date', params.from_date);
    if (params.to_date) q.append('to_date', params.to_date);
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.sort_dir) q.append('sort_dir', params.sort_dir);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    return apiClient<MunicipalComplaint[]>(`/municipal/complaints?${q.toString()}`);
  },

  getComplaint: (id: string) => apiClient<MunicipalComplaint>(`/municipal/complaints/${id}`),

  verifyComplaint: (id: string, data: {
    officer_notes?: string;
    department_id?: number;
    priority_level?: PriorityLevel;
    due_date?: string;
  }) =>
    apiClient<MunicipalComplaint>(`/municipal/complaints/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  rejectComplaint: (id: string, data: {
    rejection_reason: string;
    officer_notes?: string;
  }) =>
    apiClient<MunicipalComplaint>(`/municipal/complaints/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  assignComplaint: (id: string, data: {
    department_id: number;
    assigned_to: string;
    priority_level?: PriorityLevel;
    due_date?: string;
    instructions?: string;
  }) =>
    apiClient<MunicipalComplaint>(`/municipal/complaints/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recordProgress: (id: string, data: { progress_notes: string }) =>
    apiClient<MunicipalComplaint>(`/municipal/complaints/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitResolutionEvidence: (id: string, data: {
    completion_notes: string;
    evidence_image_ids?: string[];
  }) =>
    apiClient<MunicipalComplaint>(`/municipal/complaints/${id}/resolution/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reviewResolution: (id: string, data: {
    decision: 'approve' | 'reject' | 'reopen';
    review_notes?: string;
  }) =>
    apiClient<MunicipalComplaint>(`/municipal/complaints/${id}/resolution/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listAssignments: (params: { status?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    return apiClient<MunicipalAssignment[]>(`/municipal/assignments?${q.toString()}`);
  },

  listDepartments: () => apiClient<Department[]>('/municipal/departments'),

  listStaff: (department_id?: number) => {
    const q = department_id ? `?department_id=${department_id}` : '';
    return apiClient<MunicipalStaff[]>(`/municipal/staff${q}`);
  },

  getAuditLogs: (params: { action?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.action) q.append('action', params.action);
    if (params.limit) q.append('limit', params.limit.toString());
    return apiClient<AuditLogItem[]>(`/municipal/audit-logs?${q.toString()}`);
  },

  uploadEvidenceImage: async (complaintId: string, file: File): Promise<ReportImage> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('civic_pulse_token');
    const response = await fetch(`/api/v1/reports/${complaintId}/images?is_resolution_evidence=true`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Image upload failed');
    }
    return response.json();
  },

  getExportCsvUrl: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params);
    return `/api/v1/municipal/export/csv?${q.toString()}`;
  }
};
