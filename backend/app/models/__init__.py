from datetime import datetime, timezone
from enum import Enum
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    CITIZEN = "citizen"
    STAFF = "staff"             # Municipal Officer / Operational Staff
    OFFICER = "officer"         # Municipal Officer (verification & assignment)
    FIELD_WORKER = "field_worker" # Field Maintenance & Repair Worker
    ADMIN = "admin"             # Municipal Administrator


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    members = relationship("User", back_populates="department")
    assigned_reports = relationship("Report", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, native_enum=False), nullable=False, default=UserRole.CITIZEN, index=True)
    account_status = Column(SQLEnum(UserStatus, native_enum=False), nullable=False, default=UserStatus.ACTIVE)
    phone_number = Column(String(20), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    department = relationship("Department", back_populates="members")
    reports = relationship("Report", foreign_keys="Report.reported_by", back_populates="reporter")
    assigned_reports = relationship("Report", foreign_keys="Report.assigned_to", back_populates="assignee")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    icon_name = Column(String(50), nullable=True, default="AlertCircle")
    color_hint = Column(String(20), nullable=True, default="#0E7C86")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    reports = relationship("Report", foreign_keys="Report.category_id", back_populates="category")


class ReportStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLUTION_SUBMITTED = "RESOLUTION_SUBMITTED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    NEEDS_INFORMATION = "NEEDS_INFORMATION"
    REOPENED = "REOPENED"
    REJECTED = "REJECTED"


class PriorityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    public_reference = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Category separation: AI suggested vs human confirmed
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    ai_suggested_category = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    needs_human_review = Column(Boolean, default=False, nullable=False)
    
    reported_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Location
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location_description = Column(String(255), nullable=True)
    ward_or_area = Column(String(100), nullable=True, index=True)
    
    # Workflow Status
    status = Column(SQLEnum(ReportStatus, native_enum=False), default=ReportStatus.SUBMITTED, nullable=False, index=True)
    
    # Priority
    priority_score = Column(Float, default=10.0, nullable=False, index=True)
    priority_level = Column(SQLEnum(PriorityLevel, native_enum=False), default=PriorityLevel.LOW, nullable=False, index=True)
    priority_explanation = Column(Text, nullable=True)
    
    # Assignment & Municipal Officers
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    officer_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reported_by], back_populates="reports")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_reports")
    category = relationship("Category", foreign_keys=[category_id], back_populates="reports")
    department = relationship("Department", foreign_keys=[department_id], back_populates="assigned_reports")
    verifier = relationship("User", foreign_keys=[verified_by])
    images = relationship("ReportImage", back_populates="report", cascade="all, delete-orphan")
    history = relationship("ReportHistory", back_populates="report", cascade="all, delete-orphan", order_by="desc(ReportHistory.created_at)")
    assignments = relationship("Assignment", back_populates="report", cascade="all, delete-orphan", order_by="desc(Assignment.assigned_at)")

    __table_args__ = (
        Index("idx_reports_status_priority", "status", "priority_score"),
        Index("idx_reports_coords", "latitude", "longitude"),
    )


class ReportImage(Base):
    __tablename__ = "report_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(36), ForeignKey("reports.id"), nullable=False, index=True)
    storage_key = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    is_resolution_evidence = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    report = relationship("Report", back_populates="images")


class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(36), ForeignKey("reports.id"), nullable=False, index=True)
    changed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    previous_status = Column(SQLEnum(ReportStatus, native_enum=False), nullable=True)
    new_status = Column(SQLEnum(ReportStatus, native_enum=False), nullable=False)
    public_comment = Column(Text, nullable=True)
    internal_note = Column(Text, nullable=True)  # Visible to Staff/Admin only
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    report = relationship("Report", back_populates="history")
    author = relationship("User", foreign_keys=[changed_by])


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(36), ForeignKey("reports.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    instructions = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, COMPLETED, REASSIGNED
    reassign_reason = Column(Text, nullable=True)
    assigned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    unassigned_at = Column(DateTime(timezone=True), nullable=True)

    report = relationship("Report", back_populates="assignments")
    department = relationship("Department", foreign_keys=[department_id])
    staff_member = relationship("User", foreign_keys=[assigned_to])
    assigner = relationship("User", foreign_keys=[assigned_by])


class DuplicateReviewStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"


class DuplicateRelationship(Base):
    __tablename__ = "duplicate_relationships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    primary_report_id = Column(String(36), ForeignKey("reports.id"), nullable=False, index=True)
    duplicate_report_id = Column(String(36), ForeignKey("reports.id"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    distance_meters = Column(Float, nullable=True)
    detection_method = Column(String(50), default="ai_hybrid_geo_text", nullable=False)
    review_status = Column(SQLEnum(DuplicateReviewStatus, native_enum=False), default=DuplicateReviewStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    primary_report = relationship("Report", foreign_keys=[primary_report_id])
    duplicate_report = relationship("Report", foreign_keys=[duplicate_report_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    report_id = Column(String(36), ForeignKey("reports.id"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    recipient = relationship("User", back_populates="notifications")
    report = relationship("Report", foreign_keys=[report_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    metadata_json = Column(Text, nullable=True)  # sanitized json only

    actor = relationship("User", foreign_keys=[actor_id])
