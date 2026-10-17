from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import User, UserRole, UserStatus, Category, AuditLog
from app.schemas import (
    UserResponse, UserRoleUpdate, CategoryCreate, CategoryResponse, AuditLogResponse
)
from app.api.deps import get_current_admin
from app.core.audit import log_audit_event

router = APIRouter(prefix="/admin", tags=["Administrator Management"])


@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[UserRole] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Lists registered users and their current roles."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)

    offset = (page - 1) * page_size
    users = query.order_by(desc(User.created_at)).offset(offset).limit(page_size).all()
    return [UserResponse.model_validate(u) for u in users]


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    role_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Updates an account's role (Citizen, Staff, Admin)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.id == current_admin.id and role_in.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote your own administrator account."
        )

    old_role = user.role
    user.role = role_in.role
    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        action="USER_ROLE_CHANGED",
        entity_type="User",
        entity_id=user.id,
        actor_id=current_admin.id,
        metadata={"old_role": old_role.value, "new_role": role_in.role.value, "user_email": user.email}
    )

    return UserResponse.model_validate(user)


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """Lists all configured categories (public or admin)."""
    cats = db.query(Category).order_by(Category.id).all()
    return [CategoryResponse.model_validate(c) for c in cats]


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Creates a new civic issue category."""
    existing = db.query(Category).filter(Category.name.ilike(cat_in.name.strip())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists.")

    new_cat = Category(
        name=cat_in.name.strip(),
        description=cat_in.description,
        icon_name=cat_in.icon_name or "AlertCircle",
        color_hint=cat_in.color_hint or "#0E7C86",
        is_active=cat_in.is_active
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)

    log_audit_event(
        db,
        action="CATEGORY_CREATED",
        entity_type="Category",
        entity_id=str(new_cat.id),
        actor_id=current_admin.id,
        metadata={"category_name": new_cat.name}
    )

    return CategoryResponse.model_validate(new_cat)


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Queries system audit events."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    offset = (page - 1) * page_size
    logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(page_size).all()

    results = []
    for l in logs:
        results.append(AuditLogResponse(
            id=l.id,
            actor_id=l.actor_id,
            actor_name=l.actor.name if l.actor else "System",
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            timestamp=l.timestamp,
            metadata_json=l.metadata_json
        ))
    return results
