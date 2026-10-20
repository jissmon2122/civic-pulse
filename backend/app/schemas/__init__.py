from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models import UserRole, UserStatus, ReportStatus, PriorityLevel, DuplicateReviewStatus


# -------------------------------- AUTH & USERS --------------------------------
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    phone_number: Optional[str] = None


class UserLogin(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    account_status: UserStatus
    phone_number: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None


# -------------------------------- CATEGORIES --------------------------------
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon_name: Optional[str] = "AlertCircle"
    color_hint: Optional[str] = "#0E7C86"
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------- REPORT IMAGES --------------------------------
class ReportImageResponse(BaseModel):
    id: str
    storage_key: str
    original_filename: str
    content_type: str
    file_size: int
    is_public: bool
    is_resolution_evidence: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------- REPORT HISTORY --------------------------------
class ReportHistoryResponse(BaseModel):
    id: int
    report_id: str
    changed_by: str
    author_name: Optional[str] = None
    previous_status: Optional[ReportStatus] = None
    new_status: ReportStatus
    public_comment: Optional[str] = None
    internal_note: Optional[str] = None  # Filtered out for regular citizens
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------- REPORTS --------------------------------
class ReportCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category_id: int
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_description: Optional[str] = None
    ward_or_area: Optional[str] = None
    ai_suggested_category: Optional[str] = None
    ai_confidence: Optional[float] = None


class ReportPublicResponse(BaseModel):
    id: str
    public_reference: str
    title: str
    description: str
    category_id: int
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    latitude: float  # may be privacy rounded on lists
    longitude: float
    location_description: Optional[str] = None
    ward_or_area: Optional[str] = None
    status: ReportStatus
    priority_level: PriorityLevel
    priority_score: float
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    images: List[ReportImageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ReportPrivateResponse(ReportPublicResponse):
    reported_by: str
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    ai_suggested_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    needs_human_review: bool = False
    priority_explanation: Optional[str] = None
    history: List[ReportHistoryResponse] = []


class ReportMapResponse(BaseModel):
    id: str
    public_reference: str
    title: str
    category_id: int
    category_name: Optional[str] = None
    latitude: float
    longitude: float
    status: ReportStatus
    priority_level: PriorityLevel
    created_at: datetime


# -------------------------------- WORKFLOW ACTIONS --------------------------------
class StatusTransitionRequest(BaseModel):
    new_status: ReportStatus
    public_comment: Optional[str] = None
    internal_note: Optional[str] = None
    resolution_evidence_key: Optional[str] = None


class AssignmentRequest(BaseModel):
    assigned_to_user_id: str
    note: Optional[str] = None


# -------------------------------- AI SCHEMAS --------------------------------
class ClassifyRequest(BaseModel):
    title: str
    description: str


class ClassifyResponse(BaseModel):
    suggested_category: str
    confidence: float
    model_version: str
    method: str
    needs_human_review: bool
    explanation: str


class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float
    category_id: Optional[int] = None
    radius_meters: Optional[float] = 150.0


class DuplicateMatchItem(BaseModel):
    candidate_report_id: str
    candidate_public_reference: Optional[str] = None
    candidate_title: Optional[str] = None
    candidate_status: Optional[str] = None
    distance_meters: float
    text_similarity: float
    composite_score: float
    explanations: List[str]
    recommended_action: str


class DuplicateCheckResponse(BaseModel):
    total_candidates_analyzed: int
    duplicate_matches: List[DuplicateMatchItem]


class PriorityExplainRequest(BaseModel):
    title: str
    description: str
    category_name: str
    created_at: Optional[datetime] = None
    duplicate_count: Optional[int] = 0


class PriorityExplainResponse(BaseModel):
    score: float
    priority_level: PriorityLevel
    factors: List[str]
    requires_human_review: bool
    is_emergency: bool
    emergency_guidance: Optional[str] = None


# -------------------------------- NOTIFICATIONS --------------------------------
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    report_id: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------- AUDIT LOGS --------------------------------
class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    timestamp: datetime
    metadata_json: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------- ANALYTICS --------------------------------
class OverviewAnalytics(BaseModel):
    total_reports: int
    open_reports: int
    in_progress_reports: int
    resolved_reports: int
    resolution_rate_percent: float
    avg_resolution_hours: Optional[float] = None
    median_resolution_hours: Optional[float] = None
    critical_overdue_count: int


class CategoryCount(BaseModel):
    category_id: int
    category_name: str
    count: int
    percentage: float


class StatusCount(BaseModel):
    status: str
    count: int


class AreaCount(BaseModel):
    ward_or_area: str
    count: int
    resolved_count: int


# -------------------------------- MUNICIPAL PORTAL SCHEMAS --------------------------------
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MunicipalStaffResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    phone_number: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    account_status: UserStatus
    active_assignments_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ComplaintVerificationRequest(BaseModel):
    department_id: Optional[int] = None
    priority_level: Optional[PriorityLevel] = None
    due_date: Optional[datetime] = None
    officer_notes: Optional[str] = None


class ComplaintRejectionRequest(BaseModel):
    reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    officer_notes: Optional[str] = None


class ComplaintAssignmentRequest(BaseModel):
    department_id: Optional[int] = None
    assigned_to: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    due_date: Optional[datetime] = None
    instructions: Optional[str] = None
    priority_level: Optional[PriorityLevel] = None
    reassign_reason: Optional[str] = None


class ComplaintProgressRequest(BaseModel):
    progress_notes: str = Field(..., min_length=3, max_length=2000)
    mark_in_progress: bool = True


class ComplaintResolutionSubmitRequest(BaseModel):
    completion_notes: str = Field(..., min_length=5, max_length=2000)
    storage_key: Optional[str] = None  # uploaded resolution evidence key
    evidence_image_ids: Optional[List[str]] = None


class ComplaintResolutionReviewRequest(BaseModel):
    approved: Optional[bool] = None
    decision: Optional[str] = None  # 'approve', 'reject', 'reopen'
    review_notes: Optional[str] = None


class MunicipalAssignmentResponse(BaseModel):
    id: int
    report_id: str
    report_title: str
    report_reference: str
    priority_level: PriorityLevel
    status: str
    assigned_to: str
    staff_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    due_date: Optional[datetime] = None
    instructions: Optional[str] = None
    assigned_at: Optional[datetime] = None
    ward_or_area: Optional[str] = None
    category_name: Optional[str] = None
    is_overdue: bool = False

    model_config = ConfigDict(from_attributes=True)


class MunicipalComplaintResponse(ReportPrivateResponse):
    report_id: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    due_date: Optional[datetime] = None
    is_overdue: bool = False
    officer_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    verifier_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    active_assignment: Optional[Dict[str, Any]] = None


class MunicipalDashboardStats(BaseModel):
    total_complaints: int
    new_complaints: int
    awaiting_verification: int
    verified_complaints: int
    assigned_complaints: int
    work_in_progress: int
    resolved_complaints: int
    overdue_complaints: int
    category_distribution: List[Dict[str, Any]]
    status_distribution: List[Dict[str, Any]]
    priority_distribution: List[Dict[str, Any]]
    recent_complaints: List[MunicipalComplaintResponse]
    high_priority_issues: List[MunicipalComplaintResponse]
    overdue_assignments: List[MunicipalComplaintResponse]
    department_workload: List[Dict[str, Any]]
    daily_trend: List[Dict[str, Any]]

