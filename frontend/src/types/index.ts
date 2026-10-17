export type UserRole = 'citizen' | 'staff' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  account_status: UserStatus;
  phone_number?: string;
  created_at: string;
}

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'NEEDS_INFORMATION'
  | 'REOPENED'
  | 'REJECTED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon_name?: string;
  color_hint?: string;
  is_active: boolean;
}

export interface ReportImage {
  id: string;
  storage_key: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  is_public: boolean;
  is_resolution_evidence: boolean;
  created_at: string;
}

export interface ReportHistoryItem {
  id: number;
  report_id: string;
  changed_by: string;
  author_name?: string;
  previous_status?: ReportStatus;
  new_status: ReportStatus;
  public_comment?: string;
  internal_note?: string;
  created_at: string;
}

export interface Report {
  id: string;
  public_reference: string;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  latitude: number;
  longitude: number;
  location_description?: string;
  ward_or_area?: string;
  status: ReportStatus;
  priority_level: PriorityLevel;
  priority_score: number;
  priority_explanation?: string;
  ai_suggested_category?: string;
  ai_confidence?: number;
  needs_human_review?: boolean;
  reported_by?: string;
  reporter_name?: string;
  reporter_email?: string;
  assigned_to?: string;
  assignee_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  images: ReportImage[];
  history?: ReportHistoryItem[];
}

export interface ClassifyResult {
  suggested_category: string;
  confidence: number;
  model_version: string;
  method: string;
  needs_human_review: boolean;
  explanation: string;
}

export interface DuplicateCandidate {
  candidate_report_id: string;
  candidate_public_reference?: string;
  candidate_title?: string;
  candidate_status?: string;
  distance_meters: number;
  text_similarity: number;
  composite_score: number;
  explanations: string[];
  recommended_action: string;
}

export interface PriorityResult {
  score: number;
  priority_level: PriorityLevel;
  factors: string[];
  requires_human_review: boolean;
  is_emergency: boolean;
  emergency_guidance?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  report_id?: string;
  read_at?: string;
  created_at: string;
}

export interface OverviewAnalytics {
  total_reports: number;
  open_reports: number;
  in_progress_reports: number;
  resolved_reports: number;
  resolution_rate_percent: number;
  avg_resolution_hours?: number;
  median_resolution_hours?: number;
  critical_overdue_count: number;
}

export interface CategoryStat {
  category_id: number;
  category_name: string;
  count: number;
  percentage: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface AreaStat {
  ward_or_area: string;
  count: number;
  resolved_count: number;
}

export interface Hotspot {
  center_lat: number;
  center_lon: number;
  count: number;
  avg_priority: number;
  sample_report_ids: string[];
}

export interface AuditLogItem {
  id: number;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  timestamp: string;
  metadata_json?: string;
}
