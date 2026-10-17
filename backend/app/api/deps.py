from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.core.security import decode_access_token
from app.models import User, UserRole, UserStatus

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """Validates the JWT token and loads the authenticated user."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload invalid.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with token does not exist."
        )

    if user.account_status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is suspended or inactive."
        )

    return user


def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """Retrieves current user if token is provided and valid, otherwise returns None."""
    if not token:
        return None
    try:
        return get_current_user(db=db, token=token)
    except HTTPException:
        return None


def get_current_municipal_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Enforces that the user has any valid municipal credential (Staff, Officer, Field Worker, or Admin)."""
    if current_user.role not in (UserRole.STAFF, UserRole.OFFICER, UserRole.FIELD_WORKER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: municipal staff, officer, or administrator credentials required."
        )
    return current_user


def get_current_officer_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Enforces that the user has municipal OFFICER, STAFF, or ADMIN privileges (excludes field workers from decision approval)."""
    if current_user.role not in (UserRole.STAFF, UserRole.OFFICER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: municipal officer or administrator privileges required."
        )
    return current_user


def get_current_staff_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Backward-compatible helper enforcing municipal staff or administrator privileges."""
    if current_user.role not in (UserRole.STAFF, UserRole.OFFICER, UserRole.FIELD_WORKER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: municipal credentials required."
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Enforces that the user has ADMIN privileges."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: administrator privileges required."
        )
    return current_user
