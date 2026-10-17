from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, UserStatus
from app.schemas import UserRegister, UserLogin, Token, UserResponse, UserProfileUpdate
from app.core.security import hash_password, verify_password, create_access_token
from app.core.rate_limit import rate_limit
from app.core.audit import log_audit_event
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit(10, 60))])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Registers a new citizen user. Role is strictly assigned as CITIZEN."""
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        password_hash=hash_password(user_in.password),
        role=UserRole.CITIZEN,  # Role elevation strictly forbidden
        account_status=UserStatus.ACTIVE,
        phone_number=user_in.phone_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db,
        action="USER_REGISTERED",
        entity_type="User",
        entity_id=new_user.id,
        actor_id=new_user.id,
        metadata={"email": new_user.email, "role": new_user.role.value}
    )

    access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(new_user))


@router.post("/login", response_model=Token, dependencies=[Depends(rate_limit(15, 60))])
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates a user and issues an access token."""
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if user.account_status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated. Contact municipal administrator."
        )

    log_audit_event(
        db,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=user.id,
        actor_id=user.id
    )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieves profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates permitted profile data (name, phone)."""
    if profile_in.name is not None:
        current_user.name = profile_in.name.strip()
    if profile_in.phone_number is not None:
        current_user.phone_number = profile_in.phone_number.strip()
        
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
    """Terminates session on client side."""
    return {"message": "Successfully logged out."}
