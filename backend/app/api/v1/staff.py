from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models import (
    Report, ReportStatus, PriorityLevel, User, UserRole, ReportHistory,
    Assignment, ReportImage
)
from app.schemas import (
    ReportPrivateResponse, StatusTransitionRequest, AssignmentRequest
)
from app.api.deps import get_current_staff_or_admin
from app.core.workflow import can_transition_status
from app.core.audit import log_audit_event
from app.services.notifications import create_notification
from app.api.v1.reports import _build_private_response

router = APIRouter(prefix="/staff", tags=["Staff Operations"])


@router.get("/reports", response_model=List[ReportPrivateResponse])
def list_staff_reports(
    assigned_only: bool = False,
    status_filter: Optional[ReportStatus] = None,
    priority_filter: Optional[PriorityLevel] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_staff: User = Depends(get_current_staff_or_admin)
):
    """Lists operational reports for triage, resolution, and oversight."""
    query = db.query(Report)

    if assigned_only:
        query = query.filter(Report.assigned_to == current_staff.id)

    if status_filter:
        query = query.filter(Report.status == status_filter)

    if priority_filter:
        query = query.filter(Report.priority_level == priority_filter)

    offset = (page - 1) * page_size
    reports = query.order_by(
        desc(Report.priority_score),
        desc(Report.created_at)
    ).offset(offset).limit(page_size).all()

    return [_build_private_response(r, db, is_staff=True, is_owner=False) for r in reports]


@router.post("/reports/{report_id}/status", response_model=ReportPrivateResponse)
def update_report_status(
    report_id: str,
    request: StatusTransitionRequest,
    db: Session = Depends(get_db),
    current_staff: User = Depends(get_current_staff_or_admin)
):
    """
    Executes a formal workflow state transition.
    Enforces state machine rules, records public/internal notes, logs audit entries,
    and dispatches citizen updates.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    allowed, err_msg = can_transition_status(
        current_status=report.status,
        target_status=request.new_status,
        role=current_staff.role,
        is_reporter=False
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # Resolution requirement: resolution comment is mandatory
    if request.new_status == ReportStatus.RESOLVED:
        if not request.public_comment or len(request.public_comment.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A clear public resolution comment explaining the fix is required to mark an issue as RESOLVED."
            )
        report.resolved_at = datetime.now(timezone.utc)
    elif request.new_status != ReportStatus.RESOLVED:
        report.resolved_at = None

    prev_status = report.status
    report.status = request.new_status
    report.updated_at = datetime.now(timezone.utc)

    # Record in ReportHistory
    history = ReportHistory(
        report_id=report.id,
        changed_by=current_staff.id,
        previous_status=prev_status,
        new_status=request.new_status,
        public_comment=request.public_comment.strip() if request.public_comment else f"Status changed to {request.new_status.value}.",
        internal_note=request.internal_note.strip() if request.internal_note else None
    )
    db.add(history)

    # Notify Citizen
    create_notification(
        db,
        recipient_id=report.reported_by,
        report_id=report.id,
        title=f"Report Status Update: {request.new_status.value}",
        message=f"Report #{report.public_reference} status has been updated to {request.new_status.value}. {request.public_comment or ''}"
    )

    # Log Audit
    log_audit_event(
        db,
        action="REPORT_STATUS_TRANSITION",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_staff.id,
        metadata={
            "from_status": prev_status.value,
            "to_status": request.new_status.value,
            "public_ref": report.public_reference
        }
    )

    db.commit()
    db.refresh(report)
    return _build_private_response(report, db, is_staff=True, is_owner=False)


@router.post("/reports/{report_id}/assign", response_model=ReportPrivateResponse)
def assign_report(
    report_id: str,
    request: AssignmentRequest,
    db: Session = Depends(get_db),
    current_staff: User = Depends(get_current_staff_or_admin)
):
    """Assigns or reassigns an issue to a municipal staff member."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    target_staff = db.query(User).filter(
        User.id == request.assigned_to_user_id,
        User.role.in_([UserRole.STAFF, UserRole.ADMIN])
    ).first()

    if not target_staff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Designated assignee is not an authorized municipal staff member."
        )

    # Update assignment records
    now = datetime.now(timezone.utc)
    
    # Close any active assignments
    active_assignments = db.query(Assignment).filter(
        Assignment.report_id == report.id,
        Assignment.unassigned_at.is_(None)
    ).all()
    for a in active_assignments:
        a.unassigned_at = now

    new_assignment = Assignment(
        report_id=report.id,
        assigned_to=target_staff.id,
        assigned_by=current_staff.id,
        assigned_at=now
    )
    db.add(new_assignment)

    report.assigned_to = target_staff.id
    if report.status in (ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW):
        report.status = ReportStatus.ASSIGNED

    # History record
    history = ReportHistory(
        report_id=report.id,
        changed_by=current_staff.id,
        previous_status=report.status,
        new_status=report.status,
        public_comment=f"Assigned to municipal field personnel ({target_staff.name}).",
        internal_note=request.note
    )
    db.add(history)

    # Notify Assigned Staff
    create_notification(
        db,
        recipient_id=target_staff.id,
        report_id=report.id,
        title="New Task Assignment",
        message=f"You have been assigned to handle report #{report.public_reference} ({report.title})."
    )

    log_audit_event(
        db,
        action="REPORT_ASSIGNED",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_staff.id,
        metadata={"assigned_to": target_staff.id, "public_ref": report.public_reference}
    )

    db.commit()
    db.refresh(report)
    return _build_private_response(report, db, is_staff=True, is_owner=False)


@router.get("/workload")
def get_staff_workload(
    db: Session = Depends(get_db),
    current_staff: User = Depends(get_current_staff_or_admin)
):
    """Operational queue numbers for the current staff member's view."""
    total_unassigned = db.query(Report).filter(
        Report.assigned_to.is_(None),
        Report.status.in_([ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW])
    ).count()

    my_active = db.query(Report).filter(
        Report.assigned_to == current_staff.id,
        Report.status.in_([ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS])
    ).count()

    critical_count = db.query(Report).filter(
        Report.priority_level == PriorityLevel.CRITICAL,
        Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED])
    ).count()

    return {
        "unassigned_queue": total_unassigned,
        "my_active_cases": my_active,
        "critical_pending": critical_count
    }
