import csv
import io
import os
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc, func

from app.database import get_db
from app.models import (
    Report, ReportStatus, PriorityLevel, Category, Department, ReportImage,
    ReportHistory, Assignment, UserRole, User, UserStatus, AuditLog
)
from app.schemas import (
    MunicipalStaffResponse, DepartmentResponse, DepartmentCreate,
    ComplaintVerificationRequest, ComplaintRejectionRequest,
    ComplaintAssignmentRequest, ComplaintProgressRequest,
    ComplaintResolutionSubmitRequest, ComplaintResolutionReviewRequest,
    MunicipalComplaintResponse, MunicipalAssignmentResponse, MunicipalDashboardStats, StatusTransitionRequest,
    Token, UserLogin, UserResponse
)
from app.api.deps import (
    get_current_user, get_current_municipal_user,
    get_current_officer_or_admin, get_current_admin
)
from app.core.security import verify_password, create_access_token
from app.core.audit import log_audit_event
from app.core.workflow import can_transition_status
from app.services.notifications import create_notification
from app.services.storage import secure_save_image

router = APIRouter(prefix="/municipal", tags=["Municipal Portal"])


def _utc_now():
    return datetime.now(timezone.utc)


def _to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _sanitize_csv_cell(value: Any) -> str:
    """Protects against spreadsheet formula injection (=, +, -, @, tab, CR)."""
    if value is None:
        return ""
    text = str(value).strip()
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{text}"
    return text


def _build_municipal_complaint_response(report: Report, db: Session) -> MunicipalComplaintResponse:
    """Helper to assemble a complete, typed Municipal complaint record."""
    cat = report.category
    dept = report.department
    reporter = report.reporter
    assignee = report.assignee
    verifier = report.verifier

    # Active assignment
    active_assign = db.query(Assignment).filter(
        Assignment.report_id == report.id,
        Assignment.status == "ACTIVE"
    ).order_by(desc(Assignment.assigned_at)).first()

    assign_dict = None
    if active_assign:
        assign_dict = {
            "id": active_assign.id,
            "assigned_to": active_assign.assigned_to,
            "staff_name": active_assign.staff_member.name if active_assign.staff_member else None,
            "department_id": active_assign.department_id,
            "department_name": active_assign.department.name if active_assign.department else None,
            "due_date": active_assign.due_date.isoformat() if active_assign.due_date else None,
            "instructions": active_assign.instructions,
            "assigned_at": active_assign.assigned_at.isoformat() if active_assign.assigned_at else None,
            "status": active_assign.status
        }

    # Check overdue status
    is_overdue = False
    now = _utc_now()
    r_due = _to_utc(report.due_date)
    r_created = _to_utc(report.created_at)
    if report.status not in (ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED):
        if r_due and r_due < now:
            is_overdue = True
        elif not r_due and r_created and (now - r_created).days > 7:
            is_overdue = True

    # Assemble history
    history_entries = []
    for h in report.history:
        history_entries.append({
            "id": h.id,
            "report_id": h.report_id,
            "changed_by": h.changed_by,
            "author_name": h.author.name if h.author else "System",
            "previous_status": h.previous_status,
            "new_status": h.new_status,
            "public_comment": h.public_comment,
            "internal_note": h.internal_note,
            "created_at": h.created_at
        })

    # Images
    images_list = [{
        "id": img.id,
        "storage_key": img.storage_key,
        "original_filename": img.original_filename,
        "content_type": img.content_type,
        "file_size": img.file_size,
        "is_public": img.is_public,
        "is_resolution_evidence": img.is_resolution_evidence,
        "created_at": img.created_at
    } for img in report.images]

    return MunicipalComplaintResponse(
        id=report.id,
        report_id=report.id,
        public_reference=report.public_reference,
        title=report.title,
        description=report.description,
        category_id=report.category_id,
        category_name=cat.name if cat else "General",
        category_icon=cat.icon_name if cat else "AlertCircle",
        latitude=report.latitude,
        longitude=report.longitude,
        location_description=report.location_description,
        ward_or_area=report.ward_or_area,
        status=report.status,
        priority_level=report.priority_level,
        priority_score=report.priority_score,
        created_at=report.created_at,
        updated_at=report.updated_at,
        resolved_at=report.resolved_at,
        images=images_list,
        reported_by=report.reported_by,
        reporter_name=reporter.name if reporter else "Citizen",
        reporter_email=reporter.email if reporter else None,
        department_id=report.department_id,
        department_name=dept.name if dept else None,
        department_code=dept.code if dept else None,
        assigned_to=report.assigned_to,
        assignee_name=assignee.name if assignee else None,
        due_date=report.due_date,
        is_overdue=is_overdue,
        officer_notes=report.officer_notes,
        verified_at=report.verified_at,
        verified_by=report.verified_by,
        verifier_name=verifier.name if verifier else None,
        rejection_reason=report.rejection_reason,
        ai_suggested_category=report.ai_suggested_category,
        ai_confidence=report.ai_confidence,
        needs_human_review=report.needs_human_review,
        priority_explanation=report.priority_explanation,
        history=history_entries,
        active_assignment=assign_dict
    )


# -------------------------------- AUTHENTICATION --------------------------------
@router.post("/auth/login", response_model=Token)
def municipal_login(login_in: UserLogin, db: Session = Depends(get_db)):
    """
    Dedicated Municipal Staff Login.
    Strictly verifies credentials and enforces municipal role (STAFF, OFFICER, FIELD_WORKER, or ADMIN).
    Rejects ordinary citizen accounts with HTTP 403 Forbidden.
    """
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect municipal email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if user.account_status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Municipal staff account is suspended or deactivated. Contact your supervisor."
        )

    if user.role not in (UserRole.ADMIN, UserRole.STAFF, UserRole.OFFICER, UserRole.FIELD_WORKER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Municipal staff, officer, or administrator credentials required."
        )

    log_audit_event(
        db,
        action="MUNICIPAL_STAFF_LOGIN",
        entity_type="User",
        entity_id=user.id,
        actor_id=user.id,
        metadata={"role": user.role.value, "department_id": user.department_id}
    )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


# -------------------------------- DASHBOARD STATS --------------------------------
@router.get("/dashboard", response_model=MunicipalDashboardStats)
def get_municipal_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """
    Calculates real operational statistics, cards, charts, and queues from actual database records.
    """
    now = _utc_now()
    all_reports = db.query(Report).all()

    total = len(all_reports)
    new_c = sum(1 for r in all_reports if r.status == ReportStatus.SUBMITTED)
    awaiting_verif = sum(1 for r in all_reports if r.status in (ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW))
    verified_c = sum(1 for r in all_reports if r.status == ReportStatus.VERIFIED)
    assigned_c = sum(1 for r in all_reports if r.status == ReportStatus.ASSIGNED)
    in_prog_c = sum(1 for r in all_reports if r.status == ReportStatus.IN_PROGRESS)
    resolved_c = sum(1 for r in all_reports if r.status in (ReportStatus.RESOLVED, ReportStatus.CLOSED))

    # Overdue calculation
    overdue_c = 0
    overdue_list = []
    for r in all_reports:
        if r.status not in (ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED):
            r_due = _to_utc(r.due_date)
            r_created = _to_utc(r.created_at)
            if r_due and r_due < now:
                overdue_c += 1
                overdue_list.append(r)
            elif not r_due and r_created and (now - r_created).days > 7:
                overdue_c += 1
                overdue_list.append(r)

    # Category distribution
    cat_counts: Dict[str, int] = {}
    for r in all_reports:
        cname = r.category.name if r.category else "Uncategorized"
        cat_counts[cname] = cat_counts.get(cname, 0) + 1
    category_distribution = [
        {"name": k, "count": v, "percentage": round((v / total * 100) if total > 0 else 0, 1)}
        for k, v in cat_counts.items()
    ]

    # Status distribution
    status_counts: Dict[str, int] = {}
    for r in all_reports:
        status_counts[r.status.value] = status_counts.get(r.status.value, 0) + 1
    status_distribution = [
        {"status": k, "count": v} for k, v in status_counts.items()
    ]

    # Priority distribution
    priority_counts: Dict[str, int] = {}
    for r in all_reports:
        priority_counts[r.priority_level.value] = priority_counts.get(r.priority_level.value, 0) + 1
    priority_distribution = [
        {"priority": k, "count": v} for k, v in priority_counts.items()
    ]

    # Department workloads
    departments = db.query(Department).filter(Department.is_active == True).all()
    dept_workload = []
    for d in departments:
        d_reports = [r for r in all_reports if r.department_id == d.id]
        active = sum(1 for r in d_reports if r.status not in (ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED))
        resolved = sum(1 for r in d_reports if r.status in (ReportStatus.RESOLVED, ReportStatus.CLOSED))
        dept_workload.append({
            "department_id": d.id,
            "department_name": d.name,
            "department_code": d.code,
            "active_count": active,
            "resolved_count": resolved,
            "total_count": len(d_reports)
        })

    # Recent complaints (last 6)
    recent_records = db.query(Report).order_by(desc(Report.created_at)).limit(6).all()
    recent_complaints = [_build_municipal_complaint_response(r, db) for r in recent_records]

    # High priority issues (CRITICAL or HIGH, open)
    high_priority_records = db.query(Report).filter(
        Report.priority_level.in_([PriorityLevel.CRITICAL, PriorityLevel.HIGH]),
        Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED])
    ).order_by(desc(Report.priority_score)).limit(6).all()
    high_priority_issues = [_build_municipal_complaint_response(r, db) for r in high_priority_records]

    # Overdue list
    overdue_complaints_res = [_build_municipal_complaint_response(r, db) for r in overdue_list[:6]]

    # 14-day daily timeline trend
    daily_trend = []
    for i in range(13, -1, -1):
        target_date = (now - timedelta(days=i)).date()
        day_count = sum(1 for r in all_reports if r.created_at and _to_utc(r.created_at).date() == target_date)
        resolved_day = sum(1 for r in all_reports if r.resolved_at and _to_utc(r.resolved_at).date() == target_date)
        daily_trend.append({
            "date": target_date.strftime("%b %d"),
            "submitted": day_count,
            "resolved": resolved_day
        })

    return MunicipalDashboardStats(
        total_complaints=total,
        new_complaints=new_c,
        awaiting_verification=awaiting_verif,
        verified_complaints=verified_c,
        assigned_complaints=assigned_c,
        work_in_progress=in_prog_c,
        resolved_complaints=resolved_c,
        overdue_complaints=overdue_c,
        category_distribution=category_distribution,
        status_distribution=status_distribution,
        priority_distribution=priority_distribution,
        recent_complaints=recent_complaints,
        high_priority_issues=high_priority_issues,
        overdue_assignments=overdue_complaints_res,
        department_workload=dept_workload,
        daily_trend=daily_trend
    )


# -------------------------------- COMPLAINTS MANAGEMENT --------------------------------
@router.get("/complaints", response_model=List[MunicipalComplaintResponse])
def list_municipal_complaints(
    search: Optional[str] = Query(None, min_length=1),
    status: Optional[ReportStatus] = None,
    category_id: Optional[int] = None,
    priority_level: Optional[PriorityLevel] = None,
    department_id: Optional[int] = None,
    assigned_to: Optional[str] = None,
    ward_or_area: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    sort_by: str = Query("priority", pattern="^(priority|date|status|due_date)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """
    Search, filter, sort, and paginate through complaints.
    Field workers can view complaints; if restricted to assigned work, use /assignments.
    """
    query = db.query(Report)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Report.id.ilike(term),
                Report.public_reference.ilike(term),
                Report.title.ilike(term),
                Report.description.ilike(term),
                Report.location_description.ilike(term),
                Report.ward_or_area.ilike(term)
            )
        )

    if status:
        query = query.filter(Report.status == status)

    if category_id:
        query = query.filter(Report.category_id == category_id)

    if priority_level:
        query = query.filter(Report.priority_level == priority_level)

    if department_id:
        query = query.filter(Report.department_id == department_id)

    if assigned_to:
        query = query.filter(Report.assigned_to == assigned_to)

    if ward_or_area and ward_or_area.strip():
        query = query.filter(Report.ward_or_area.ilike(f"%{ward_or_area.strip()}%"))

    if from_date:
        query = query.filter(Report.created_at >= from_date)

    if to_date:
        query = query.filter(Report.created_at <= to_date)

    if is_overdue is True:
        now = _utc_now()
        query = query.filter(
            Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED]),
            or_(
                Report.due_date < now,
                and_(Report.due_date == None, Report.created_at < (now - timedelta(days=7)))
            )
        )

    # Sorting
    if sort_by == "priority":
        sort_col = Report.priority_score
    elif sort_by == "date":
        sort_col = Report.created_at
    elif sort_by == "due_date":
        sort_col = Report.due_date
    else:
        sort_col = Report.status

    if sort_dir == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    return [_build_municipal_complaint_response(r, db) for r in records]


@router.get("/complaints/{complaint_id}", response_model=MunicipalComplaintResponse)
def get_municipal_complaint_detail(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """
    Returns full record for an individual complaint, including citizen details,
    full resolution history, coordinates, and assignment data.
    """
    report = db.query(Report).filter(
        or_(Report.id == complaint_id, Report.public_reference == complaint_id)
    ).first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    return _build_municipal_complaint_response(report, db)


# -------------------------------- COMPLAINT VERIFICATION --------------------------------
@router.post("/complaints/{complaint_id}/verify", response_model=MunicipalComplaintResponse)
def verify_complaint(
    complaint_id: str,
    request: ComplaintVerificationRequest,
    db: Session = Depends(get_db),
    current_officer: User = Depends(get_current_officer_or_admin)
):
    """
    Legitimacy Verification: Municipal Officer inspects complaint and marks it as VERIFIED.
    Allows adjusting priority and recording officer verification notes.
    """
    report = db.query(Report).filter(Report.id == complaint_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    allowed, err_msg = can_transition_status(
        current_status=report.status,
        target_status=ReportStatus.VERIFIED,
        role=current_officer.role
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    prev_status = report.status
    report.status = ReportStatus.VERIFIED
    report.verified_by = current_officer.id
    report.verified_at = _utc_now()
    report.updated_at = _utc_now()

    if request.priority_level:
        report.priority_level = request.priority_level
        report.priority_explanation = (
            f"Officer {current_officer.name} manually verified and set priority to {request.priority_level.value}."
        )

    if request.department_id:
        report.department_id = request.department_id

    if request.due_date:
        report.due_date = request.due_date

    if request.officer_notes:
        report.officer_notes = request.officer_notes.strip()

    # Log in ReportHistory
    history = ReportHistory(
        report_id=report.id,
        changed_by=current_officer.id,
        previous_status=prev_status,
        new_status=ReportStatus.VERIFIED,
        public_comment="Complaint verified by municipal officer as a legitimate public issue.",
        internal_note=request.officer_notes
    )
    db.add(history)

    log_audit_event(
        db,
        action="COMPLAINT_VERIFIED",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_officer.id,
        metadata={
            "priority": report.priority_level.value,
            "officer": current_officer.name
        }
    )

    create_notification(
        db,
        recipient_id=report.reported_by,
        report_id=report.id,
        title="Complaint Verified",
        message=f"Your complaint #{report.public_reference} has been verified by municipal authorities."
    )

    db.commit()
    db.refresh(report)
    return _build_municipal_complaint_response(report, db)


# -------------------------------- COMPLAINT REJECTION --------------------------------
@router.post("/complaints/{complaint_id}/reject", response_model=MunicipalComplaintResponse)
def reject_complaint(
    complaint_id: str,
    request: ComplaintRejectionRequest,
    db: Session = Depends(get_db),
    current_officer: User = Depends(get_current_officer_or_admin)
):
    """
    Rejects invalid, duplicate, or out-of-jurisdiction complaints with a mandatory explanatory reason.
    """
    report = db.query(Report).filter(Report.id == complaint_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    allowed, err_msg = can_transition_status(
        current_status=report.status,
        target_status=ReportStatus.REJECTED,
        role=current_officer.role
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    prev_status = report.status
    reason_text = (request.rejection_reason or request.reason or "Complaint rejected by municipal officer").strip()
    report.status = ReportStatus.REJECTED
    report.rejection_reason = reason_text
    if request.officer_notes:
        report.officer_notes = request.officer_notes.strip()
    report.updated_at = _utc_now()

    history = ReportHistory(
        report_id=report.id,
        changed_by=current_officer.id,
        previous_status=prev_status,
        new_status=ReportStatus.REJECTED,
        public_comment=f"Rejected: {reason_text}",
        internal_note=f"Rejected by {current_officer.name} ({current_officer.role.value})"
    )
    db.add(history)

    log_audit_event(
        db,
        action="COMPLAINT_REJECTED",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_officer.id,
        metadata={"reason": reason_text}
    )

    create_notification(
        db,
        recipient_id=report.reported_by,
        report_id=report.id,
        title="Complaint Update: Not Actionable",
        message=f"Your complaint #{report.public_reference} was marked as not actionable: {reason_text}"
    )

    db.commit()
    db.refresh(report)
    return _build_municipal_complaint_response(report, db)


# -------------------------------- WORK ASSIGNMENT --------------------------------
@router.post("/complaints/{complaint_id}/assign", response_model=MunicipalComplaintResponse)
def assign_complaint(
    complaint_id: str,
    request: ComplaintAssignmentRequest,
    db: Session = Depends(get_db),
    current_officer: User = Depends(get_current_officer_or_admin)
):
    """
    Assigns or reassigns a complaint to a municipal department and/or specific field worker.
    Sets due date, instructions, and optionally updates priority.
    """
    report = db.query(Report).filter(Report.id == complaint_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Validate department if provided
    department = None
    if request.department_id:
        department = db.query(Department).filter(Department.id == request.department_id).first()
        if not department:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected department does not exist.")

    # Validate worker if provided
    target_worker_id = request.assigned_to or request.assigned_to_user_id
    worker = None
    if target_worker_id:
        worker = db.query(User).filter(User.id == target_worker_id).first()
        if not worker or worker.role not in (UserRole.FIELD_WORKER, UserRole.STAFF, UserRole.OFFICER):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user is not an authorized municipal staff member or field worker."
            )

    prev_status = report.status
    # Move to ASSIGNED if not already in progress
    if report.status in (ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW, ReportStatus.VERIFIED, ReportStatus.REOPENED):
        report.status = ReportStatus.ASSIGNED

    # Deactivate any previous active assignment
    existing_assignments = db.query(Assignment).filter(
        Assignment.report_id == report.id,
        Assignment.status == "ACTIVE"
    ).all()
    for ea in existing_assignments:
        ea.status = "REASSIGNED"
        ea.unassigned_at = _utc_now()
        ea.reassign_reason = request.reassign_reason or "Reassigned to another department/worker"

    # Create new assignment record
    new_assignment = Assignment(
        report_id=report.id,
        department_id=request.department_id or report.department_id,
        assigned_to=target_worker_id or report.assigned_to or current_officer.id,
        assigned_by=current_officer.id,
        due_date=request.due_date,
        instructions=request.instructions,
        status="ACTIVE",
        assigned_at=_utc_now()
    )
    db.add(new_assignment)

    if request.department_id:
        report.department_id = request.department_id
    if target_worker_id:
        report.assigned_to = target_worker_id
    if request.due_date:
        report.due_date = request.due_date
    if request.priority_level:
        report.priority_level = request.priority_level

    report.updated_at = _utc_now()

    dept_name = department.name if department else "Municipal Services"
    worker_name = worker.name if worker else "Field Team"

    history = ReportHistory(
        report_id=report.id,
        changed_by=current_officer.id,
        previous_status=prev_status,
        new_status=report.status,
        public_comment=f"Assigned to {dept_name} for field inspection and repair.",
        internal_note=f"Assigned to {worker_name}. Instructions: {request.instructions or 'Standard SLA repair'}"
    )
    db.add(history)

    log_audit_event(
        db,
        action="COMPLAINT_ASSIGNED",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_officer.id,
        metadata={
            "department": dept_name,
            "worker": worker_name,
            "due_date": request.due_date.isoformat() if request.due_date else None
        }
    )

    # Notify worker
    if worker:
        create_notification(
            db,
            recipient_id=worker.id,
            report_id=report.id,
            title="New Work Assignment",
            message=f"You have been assigned complaint #{report.public_reference} ({report.title})."
        )

    # Notify citizen
    create_notification(
        db,
        recipient_id=report.reported_by,
        report_id=report.id,
        title="Complaint Assigned to Field Crew",
        message=f"Complaint #{report.public_reference} has been assigned to {dept_name} for repair."
    )

    db.commit()
    db.refresh(report)
    return _build_municipal_complaint_response(report, db)


# -------------------------------- PROGRESS & REPAIR UPDATES --------------------------------
@router.post("/complaints/{complaint_id}/progress", response_model=MunicipalComplaintResponse)
def record_complaint_progress(
    complaint_id: str,
    request: ComplaintProgressRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """
    Field Workers or Officers record progress updates and mark complaint IN_PROGRESS.
    """
    report = db.query(Report).filter(Report.id == complaint_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    prev_status = report.status
    if request.mark_in_progress and report.status == ReportStatus.ASSIGNED:
        report.status = ReportStatus.IN_PROGRESS

    report.updated_at = _utc_now()

    history = ReportHistory(
        report_id=report.id,
        changed_by=current_user.id,
        previous_status=prev_status,
        new_status=report.status,
        public_comment=f"Repair update: {request.progress_notes.strip()}",
        internal_note=f"Recorded by {current_user.name} ({current_user.role.value})"
    )
    db.add(history)

    log_audit_event(
        db,
        action="PROGRESS_UPDATED",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_user.id,
        metadata={"notes": request.progress_notes}
    )

    db.commit()
    db.refresh(report)
    return _build_municipal_complaint_response(report, db)


# -------------------------------- RESOLUTION SUBMISSION & APPROVAL --------------------------------
@router.post("/complaints/{complaint_id}/resolution/submit", response_model=MunicipalComplaintResponse)
def submit_resolution_evidence(
    complaint_id: str,
    request: ComplaintResolutionSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """
    Field Worker submits work completion evidence for review.
    Transitions status to RESOLUTION_SUBMITTED.
    """
    report = db.query(Report).filter(Report.id == complaint_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    allowed, err_msg = can_transition_status(
        current_status=report.status,
        target_status=ReportStatus.RESOLUTION_SUBMITTED,
        role=current_user.role
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    prev_status = report.status
    report.status = ReportStatus.RESOLUTION_SUBMITTED
    report.updated_at = _utc_now()

    history = ReportHistory(
        report_id=report.id,
        changed_by=current_user.id,
        previous_status=prev_status,
        new_status=ReportStatus.RESOLUTION_SUBMITTED,
        public_comment="Field team completed repair work and submitted evidence for municipal review.",
        internal_note=f"Worker Completion Notes: {request.completion_notes.strip()}"
    )
    db.add(history)

    log_audit_event(
        db,
        action="RESOLUTION_SUBMITTED",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_user.id,
        metadata={"notes": request.completion_notes}
    )

    db.commit()
    db.refresh(report)
    return _build_municipal_complaint_response(report, db)


@router.post("/complaints/{complaint_id}/resolution/review", response_model=MunicipalComplaintResponse)
def review_resolution(
    complaint_id: str,
    request: ComplaintResolutionReviewRequest,
    db: Session = Depends(get_db),
    current_officer: User = Depends(get_current_officer_or_admin)
):
    """
    Municipal Officer reviews submitted resolution evidence.
    If approved -> marks RESOLVED with timestamp.
    If rejected -> returns to IN_PROGRESS with corrective feedback.
    """
    report = db.query(Report).filter(Report.id == complaint_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    is_approved = (request.decision == "approve") if request.decision else (request.approved is True)
    if is_approved:
        target_status = ReportStatus.RESOLVED
    elif request.decision == "reopen":
        target_status = ReportStatus.REOPENED
    else:
        target_status = ReportStatus.IN_PROGRESS

    allowed, err_msg = can_transition_status(
        current_status=report.status,
        target_status=target_status,
        role=current_officer.role
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    prev_status = report.status
    report.status = target_status
    report.updated_at = _utc_now()
    notes_str = (request.review_notes or "").strip()

    if is_approved:
        report.resolved_at = _utc_now()
        public_msg = f"Resolution Approved: {notes_str}" if notes_str else "Resolution Approved"
        audit_action = "RESOLUTION_APPROVED"
        notify_title = "Issue Resolved!"
        notify_msg = f"Your complaint #{report.public_reference} has been verified and marked RESOLVED by municipal authorities."
    else:
        report.resolved_at = None
        public_msg = f"Work returned for additional correction: {notes_str}" if notes_str else "Work returned for additional correction."
        audit_action = "RESOLUTION_RETURNED"
        notify_title = "Resolution Rechecked"
        notify_msg = f"Complaint #{report.public_reference} resolution requires additional field work."

    history = ReportHistory(
        report_id=report.id,
        changed_by=current_officer.id,
        previous_status=prev_status,
        new_status=target_status,
        public_comment=public_msg,
        internal_note=f"Officer Review by {current_officer.name}: {notes_str}"
    )
    db.add(history)

    log_audit_event(
        db,
        action=audit_action,
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_officer.id,
        metadata={"decision": request.decision, "approved": is_approved, "notes": notes_str}
    )

    create_notification(
        db,
        recipient_id=report.reported_by,
        report_id=report.id,
        title=notify_title,
        message=notify_msg
    )

    db.commit()
    db.refresh(report)
    return _build_municipal_complaint_response(report, db)


# -------------------------------- WORKER ASSIGNMENTS QUEUE --------------------------------
@router.get("/assignments", response_model=List[MunicipalAssignmentResponse])
def get_my_assignments(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """
    Returns tasks assigned to the current municipal worker or officer.
    """
    query = db.query(Assignment).join(Report, Assignment.report_id == Report.id)
    if current_user.role in (UserRole.FIELD_WORKER, UserRole.STAFF):
        query = query.filter(Assignment.assigned_to == current_user.id)
    elif current_user.role == UserRole.OFFICER and current_user.department_id:
        query = query.filter(
            or_(
                Assignment.assigned_to == current_user.id,
                Assignment.department_id == current_user.department_id
            )
        )

    if status and status.strip():
        query = query.filter(Assignment.status == status.strip().upper())

    assignment_rows = query.order_by(desc(Assignment.assigned_at)).all()

    direct_report_ids = [a.report_id for a in assignment_rows]
    orphan_reports_query = db.query(Report).filter(Report.assigned_to == current_user.id)
    if direct_report_ids:
        orphan_reports_query = orphan_reports_query.filter(Report.id.notin_(direct_report_ids))

    if status and status.strip().upper() == "ACTIVE":
        orphan_reports_query = orphan_reports_query.filter(
            Report.status.in_([ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLUTION_SUBMITTED])
        )
    orphan_reports = orphan_reports_query.order_by(desc(Report.priority_score)).all()

    results = []
    now = _utc_now()

    for a in assignment_rows:
        r = a.report
        due = _to_utc(a.due_date) or _to_utc(r.due_date)
        is_ov = False
        if r.status not in (ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED):
            if due and due < now:
                is_ov = True
            elif not due and (now - _to_utc(r.created_at)).days > 7:
                is_ov = True

        results.append(MunicipalAssignmentResponse(
            id=a.id,
            report_id=r.id,
            report_title=r.title,
            report_reference=r.public_reference,
            priority_level=r.priority_level,
            status=r.status.value if hasattr(r.status, "value") else str(r.status),
            assigned_to=a.assigned_to,
            staff_name=a.staff_member.name if a.staff_member else "Field Crew",
            department_id=a.department_id,
            department_name=a.department.name if a.department else (r.department.name if r.department else None),
            due_date=a.due_date or r.due_date,
            instructions=a.instructions,
            assigned_at=a.assigned_at,
            ward_or_area=r.ward_or_area,
            category_name=r.category.name if r.category else "General",
            is_overdue=is_ov
        ))

    pseudo_id = 9000
    for r in orphan_reports:
        pseudo_id += 1
        due = _to_utc(r.due_date)
        is_ov = False
        if r.status not in (ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED):
            if due and due < now:
                is_ov = True
            elif not due and (now - _to_utc(r.created_at)).days > 7:
                is_ov = True

        results.append(MunicipalAssignmentResponse(
            id=pseudo_id,
            report_id=r.id,
            report_title=r.title,
            report_reference=r.public_reference,
            priority_level=r.priority_level,
            status=r.status.value if hasattr(r.status, "value") else str(r.status),
            assigned_to=r.assigned_to,
            staff_name=r.assignee.name if r.assignee else "Field Crew",
            department_id=r.department_id,
            department_name=r.department.name if r.department else None,
            due_date=r.due_date,
            instructions="Assigned by Municipal Operations",
            assigned_at=r.updated_at or r.created_at,
            ward_or_area=r.ward_or_area,
            category_name=r.category.name if r.category else "General",
            is_overdue=is_ov
        ))

    return results


# -------------------------------- DEPARTMENTS & STAFF DIRECTORY --------------------------------
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """Lists all active municipal departments."""
    return db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin creates a new municipal department."""
    existing = db.query(Department).filter(
        or_(Department.name == dept_in.name.strip(), Department.code == dept_in.code.upper().strip())
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department with this name or code already exists.")

    new_dept = Department(
        name=dept_in.name.strip(),
        code=dept_in.code.upper().strip(),
        description=dept_in.description,
        contact_email=dept_in.contact_email,
        is_active=dept_in.is_active
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


@router.get("/staff", response_model=List[MunicipalStaffResponse])
def list_municipal_staff(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """Lists authorized municipal officers and field workers for assignment dropdowns."""
    query = db.query(User).filter(
        User.role.in_([UserRole.STAFF, UserRole.OFFICER, UserRole.FIELD_WORKER, UserRole.ADMIN]),
        User.account_status == UserStatus.ACTIVE
    )
    if department_id:
        query = query.filter(User.department_id == department_id)

    staff_members = query.order_by(User.name).all()
    results = []
    for s in staff_members:
        active_count = db.query(Assignment).filter(
            Assignment.assigned_to == s.id,
            Assignment.status == "ACTIVE"
        ).count()
        results.append(MunicipalStaffResponse(
            id=s.id,
            name=s.name,
            email=s.email,
            role=s.role,
            phone_number=s.phone_number,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            account_status=s.account_status,
            active_assignments_count=active_count
        ))
    return results


# -------------------------------- AUDIT LOGS --------------------------------
@router.get("/audit-logs")
def list_municipal_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_officer_or_admin)
):
    """Retrieves immutable audit trail for governance, compliance, and oversight."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "actor_id": l.actor_id,
            "actor_name": l.actor.name if l.actor else "System",
            "actor_role": l.actor.role.value if l.actor else None,
            "timestamp": l.timestamp.isoformat(),
            "metadata": l.metadata_json
        })
    return results


# -------------------------------- CSV EXPORT --------------------------------
@router.get("/export/csv")
def export_complaints_csv(
    status: Optional[ReportStatus] = None,
    category_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_municipal_user)
):
    """
    Exports filtered municipal complaints as CSV.
    All cells are sanitized against spreadsheet formula injection (=, +, -, @).
    """
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    if category_id:
        query = query.filter(Report.category_id == category_id)
    if department_id:
        query = query.filter(Report.department_id == department_id)

    reports = query.order_by(desc(Report.created_at)).limit(1000).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Headers
    writer.writerow([
        "Complaint ID", "Title", "Category", "Status", "Priority",
        "Score", "Ward/Area", "Location Description", "Department",
        "Assigned To", "Submission Date", "Due Date", "Resolved Date"
    ])

    for r in reports:
        writer.writerow([
            _sanitize_csv_cell(r.public_reference),
            _sanitize_csv_cell(r.title),
            _sanitize_csv_cell(r.category.name if r.category else ""),
            _sanitize_csv_cell(r.status.value),
            _sanitize_csv_cell(r.priority_level.value),
            _sanitize_csv_cell(r.priority_score),
            _sanitize_csv_cell(r.ward_or_area or ""),
            _sanitize_csv_cell(r.location_description or ""),
            _sanitize_csv_cell(r.department.name if r.department else "Unassigned"),
            _sanitize_csv_cell(r.assignee.name if r.assignee else "Unassigned"),
            _sanitize_csv_cell(r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else ""),
            _sanitize_csv_cell(r.due_date.strftime("%Y-%m-%d %H:%M:%S") if r.due_date else ""),
            _sanitize_csv_cell(r.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if r.resolved_at else "")
        ])

    output.seek(0)
    filename = f"municipal_complaints_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
