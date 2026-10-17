import os
import random
import string
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models import (
    Report, ReportStatus, PriorityLevel, Category, ReportImage, ReportHistory,
    DuplicateRelationship, DuplicateReviewStatus, UserRole, User
)
from app.schemas import (
    ReportCreate, ReportPublicResponse, ReportPrivateResponse, ReportMapResponse,
    ReportHistoryResponse, ReportImageResponse
)
from app.api.deps import get_current_user, get_optional_current_user
from app.services.geo import anonymize_coordinates
from app.services.storage import secure_save_image, get_image_path
from app.services.notifications import create_notification
from app.core.audit import log_audit_event
from app.core.workflow import can_transition_status
from app.ai.classifier import classifier
from app.ai.duplicates import check_duplicate_candidates
from app.ai.priority import compute_priority_score

router = APIRouter(prefix="/reports", tags=["Reports"])


def generate_public_reference() -> str:
    """Generates an official public tracking reference: CP-2026-XXXX."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=5))
    return f"CP-2026-{suffix}"


@router.post("", response_model=ReportPrivateResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a new civic issue report.
    Performs AI classification validation, priority scoring, duplicate detection,
    and creates initial history and confirmation notifications.
    """
    # 1. Verify category exists
    category = db.query(Category).filter(Category.id == report_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category ID {report_in.category_id}."
        )

    # 2. AI Category Classification
    ai_result = classifier.classify(report_in.title, report_in.description)
    suggested_cat = ai_result["suggested_category"]
    ai_conf = ai_result["confidence"]
    needs_review = ai_result["needs_human_review"]

    # 3. Duplicate Candidates Pre-check
    recent_reports = db.query(Report).filter(
        Report.status.in_([
            ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW,
            ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS
        ])
    ).all()

    candidates_input = [{
        "id": r.id,
        "public_reference": r.public_reference,
        "title": r.title,
        "description": r.description,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "category_id": r.category_id,
        "status": r.status.value
    } for r in recent_reports]

    target_data = {
        "id": "new",
        "title": report_in.title,
        "description": report_in.description,
        "latitude": report_in.latitude,
        "longitude": report_in.longitude,
        "category_id": report_in.category_id
    }
    duplicates_detected = check_duplicate_candidates(target_data, candidates_input)

    # 4. Explainable Priority Scoring
    priority_info = compute_priority_score(
        title=report_in.title,
        description=report_in.description,
        category_name=category.name,
        created_at=datetime.now(timezone.utc),
        duplicate_count=len(duplicates_detected)
    )

    # 5. Persist Report
    public_ref = generate_public_reference()
    while db.query(Report).filter(Report.public_reference == public_ref).first():
        public_ref = generate_public_reference()

    new_report = Report(
        public_reference=public_ref,
        title=report_in.title.strip(),
        description=report_in.description.strip(),
        category_id=report_in.category_id,
        ai_suggested_category=suggested_cat,
        ai_confidence=ai_conf,
        needs_human_review=needs_review,
        reported_by=current_user.id,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        location_description=report_in.location_description,
        ward_or_area=report_in.ward_or_area,
        status=ReportStatus.SUBMITTED,
        priority_score=priority_info["score"],
        priority_level=priority_info["priority_level"],
        priority_explanation=" | ".join(priority_info["factors"])
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 6. Record Initial History
    initial_history = ReportHistory(
        report_id=new_report.id,
        changed_by=current_user.id,
        previous_status=None,
        new_status=ReportStatus.SUBMITTED,
        public_comment="Citizen submitted report via web application."
    )
    db.add(initial_history)

    # 7. Persist Detected Duplicate Relationships for Staff Review
    for dup in duplicates_detected:
        dup_rel = DuplicateRelationship(
            primary_report_id=dup["candidate_report_id"],
            duplicate_report_id=new_report.id,
            similarity_score=dup["composite_score"],
            distance_meters=dup["distance_meters"],
            detection_method="ai_hybrid_geo_text",
            review_status=DuplicateReviewStatus.PENDING
        )
        db.add(dup_rel)

    # 8. Dispatch Notification to Reporter
    create_notification(
        db,
        recipient_id=current_user.id,
        report_id=new_report.id,
        title="Report Received",
        message=f"Your civic issue report #{new_report.public_reference} has been received. We will keep you updated at every step."
    )

    # 9. Log Audit Event
    log_audit_event(
        db,
        action="REPORT_CREATED",
        entity_type="Report",
        entity_id=new_report.id,
        actor_id=current_user.id,
        metadata={"public_ref": new_report.public_reference, "priority": new_report.priority_level.value}
    )

    db.commit()
    db.refresh(new_report)

    return _build_private_response(new_report, db, is_staff=False)


@router.get("", response_model=List[ReportPublicResponse])
def list_public_reports(
    search: Optional[str] = Query(None, min_length=1),
    category_id: Optional[int] = None,
    status: Optional[ReportStatus] = None,
    priority_level: Optional[PriorityLevel] = None,
    ward_or_area: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Public issue explorer list with filters, search, and pagination.
    Applies location coordinate privacy protection (rounded to ~100m).
    """
    query = db.query(Report)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Report.title.ilike(search_filter),
                Report.description.ilike(search_filter),
                Report.location_description.ilike(search_filter),
                Report.public_reference.ilike(search_filter)
            )
        )

    if category_id is not None:
        query = query.filter(Report.category_id == category_id)

    if status is not None:
        query = query.filter(Report.status == status)

    if priority_level is not None:
        query = query.filter(Report.priority_level == priority_level)

    if ward_or_area and ward_or_area.strip():
        query = query.filter(Report.ward_or_area.ilike(f"%{ward_or_area.strip()}%"))

    offset = (page - 1) * page_size
    reports = query.order_by(desc(Report.created_at)).offset(offset).limit(page_size).all()

    results = []
    for r in reports:
        anon_lat, anon_lon = anonymize_coordinates(r.latitude, r.longitude)
        cat = r.category
        results.append(ReportPublicResponse(
            id=r.id,
            public_reference=r.public_reference,
            title=r.title,
            description=r.description,
            category_id=r.category_id,
            category_name=cat.name if cat else None,
            category_icon=cat.icon_name if cat else "AlertCircle",
            latitude=anon_lat,
            longitude=anon_lon,
            location_description=r.location_description,
            ward_or_area=r.ward_or_area,
            status=r.status,
            priority_level=r.priority_level,
            priority_score=r.priority_score,
            created_at=r.created_at,
            updated_at=r.updated_at,
            resolved_at=r.resolved_at,
            images=[ReportImageResponse.model_validate(img) for img in r.images if img.is_public]
        ))
    return results


@router.get("/map", response_model=List[ReportMapResponse])
def get_map_reports(
    category_id: Optional[int] = None,
    status: Optional[ReportStatus] = None,
    ward_or_area: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns lightweight pins for the OpenStreetMap explorer across Tamil Nadu."""
    query = db.query(Report)
    if category_id is not None:
        query = query.filter(Report.category_id == category_id)
    if status is not None:
        query = query.filter(Report.status == status)
    if ward_or_area and ward_or_area.strip():
        query = query.filter(Report.ward_or_area.ilike(f"%{ward_or_area.strip()}%"))

    reports = query.order_by(desc(Report.created_at)).limit(500).all()
    results = []
    for r in reports:
        cat = r.category
        results.append(ReportMapResponse(
            id=r.id,
            public_reference=r.public_reference,
            title=r.title,
            category_id=r.category_id,
            category_name=cat.name if cat else "Civic Issue",
            latitude=r.latitude,
            longitude=r.longitude,
            status=r.status,
            priority_level=r.priority_level,
            created_at=r.created_at
        ))
    return results


@router.get("/me", response_model=List[ReportPrivateResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all reports submitted by the currently logged-in citizen."""
    reports = db.query(Report).filter(Report.reported_by == current_user.id).order_by(desc(Report.created_at)).all()
    return [_build_private_response(r, db, is_staff=False) for r in reports]


@router.get("/{report_id}", response_model=ReportPrivateResponse)
def get_report_details(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Retrieves full details for a report.
    Authorizes viewing private information only for reporter or staff/admin.
    Internal staff notes are stripped for ordinary citizens.
    """
    report = db.query(Report).filter(
        or_(Report.id == report_id, Report.public_reference == report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )

    is_staff = False
    is_owner = False
    if current_user:
        if current_user.role in (UserRole.STAFF, UserRole.ADMIN):
            is_staff = True
        if current_user.id == report.reported_by:
            is_owner = True

    return _build_private_response(report, db, is_staff=is_staff, is_owner=is_owner)


@router.post("/{report_id}/images", response_model=ReportImageResponse, status_code=status.HTTP_201_CREATED)
def upload_report_image(
    report_id: str,
    is_resolution_evidence: bool = False,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Securely uploads and attaches a sanitized photo to a report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    # Permissions: reporter can upload issue photos; staff can upload resolution evidence
    if is_resolution_evidence:
        if current_user.role not in (UserRole.STAFF, UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only municipal staff or administrators can upload resolution evidence."
            )
    else:
        if report.reported_by != current_user.id and current_user.role not in (UserRole.STAFF, UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to attach photos to another citizen's report."
            )

    storage_key, content_type, file_size = secure_save_image(file, is_resolution_evidence)

    image_record = ReportImage(
        report_id=report.id,
        storage_key=storage_key,
        original_filename=file.filename or "upload.jpg",
        content_type=content_type,
        file_size=file_size,
        is_public=True,
        is_resolution_evidence=is_resolution_evidence
    )
    db.add(image_record)
    db.commit()
    db.refresh(image_record)

    log_audit_event(
        db,
        action="REPORT_IMAGE_UPLOADED",
        entity_type="ReportImage",
        entity_id=image_record.id,
        actor_id=current_user.id,
        metadata={"report_id": report.id, "evidence": is_resolution_evidence}
    )

    return ReportImageResponse.model_validate(image_record)


@router.get("/images/{storage_key}")
def get_report_image(storage_key: str):
    """Safely serves uploaded and sanitized report photographs."""
    path = get_image_path(storage_key)
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")

    ext = os.path.splitext(path)[1].lower()
    media_types = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(path, media_type=media_type)


@router.post("/{report_id}/reopen", response_model=ReportPrivateResponse)
def citizen_reopen_report(
    report_id: str,
    reason: str = Query(..., min_length=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows a citizen to flag their resolved issue as unresolved with reasons."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    is_owner = (report.reported_by == current_user.id)
    allowed, msg = can_transition_status(
        current_status=report.status,
        target_status=ReportStatus.REOPENED,
        role=current_user.role,
        is_reporter=is_owner
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    prev_status = report.status
    report.status = ReportStatus.REOPENED
    report.resolved_at = None

    history = ReportHistory(
        report_id=report.id,
        changed_by=current_user.id,
        previous_status=prev_status,
        new_status=ReportStatus.REOPENED,
        public_comment=f"Citizen flagged issue as unresolved: {reason.strip()}"
    )
    db.add(history)

    # Notify staff assignee if assigned
    if report.assigned_to:
        create_notification(
            db,
            recipient_id=report.assigned_to,
            report_id=report.id,
            title="Report Reopened by Citizen",
            message=f"Report #{report.public_reference} has been flagged as unresolved by the citizen."
        )

    log_audit_event(
        db,
        action="REPORT_REOPENED",
        entity_type="Report",
        entity_id=report.id,
        actor_id=current_user.id,
        metadata={"reason": reason}
    )

    db.commit()
    db.refresh(report)
    return _build_private_response(report, db, is_staff=(current_user.role in (UserRole.STAFF, UserRole.ADMIN)), is_owner=is_owner)


def _build_private_response(
    report: Report,
    db: Session,
    is_staff: bool = False,
    is_owner: bool = False
) -> ReportPrivateResponse:
    """Helper to assemble a sanitized, role-aware private response."""
    cat = report.category
    reporter = report.reporter
    assignee = report.assignee

    # Build history records, stripping internal_notes for non-staff
    history_entries = []
    for h in report.history:
        entry = ReportHistoryResponse(
            id=h.id,
            report_id=h.report_id,
            changed_by=h.changed_by,
            author_name=h.author.name if h.author else "System",
            previous_status=h.previous_status,
            new_status=h.new_status,
            public_comment=h.public_comment,
            internal_note=h.internal_note if is_staff else None,
            created_at=h.created_at
        )
        history_entries.append(entry)

    # Privacy filtering: hide reporter private details from public strangers
    reporter_name = reporter.name if (is_staff or is_owner) else "Verified Citizen"
    reporter_email = reporter.email if (is_staff or is_owner) else None

    return ReportPrivateResponse(
        id=report.id,
        public_reference=report.public_reference,
        title=report.title,
        description=report.description,
        category_id=report.category_id,
        category_name=cat.name if cat else None,
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
        images=[ReportImageResponse.model_validate(img) for img in report.images],
        reported_by=report.reported_by,
        reporter_name=reporter_name,
        reporter_email=reporter_email,
        assigned_to=report.assigned_to,
        assignee_name=assignee.name if assignee else None,
        ai_suggested_category=report.ai_suggested_category,
        ai_confidence=report.ai_confidence,
        needs_human_review=report.needs_human_review,
        priority_explanation=report.priority_explanation,
        history=history_entries
    )
