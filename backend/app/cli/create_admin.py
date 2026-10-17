import sys
import argparse
from app.database import SessionLocal, Base, engine
from app.models import User, UserRole, UserStatus, Department
from app.core.security import hash_password
from app.core.audit import log_audit_event


def create_municipal_user(name: str, email: str, password: str, role: str, dept_code: str = None):
    """
    Safely provisions a municipal administrator, officer, or field worker via CLI.
    Never exposes an open public registration endpoint for elevated privileges.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        email_clean = email.lower().strip()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            print(f"[ERROR] User with email '{email_clean}' already exists.")
            sys.exit(1)

        role_enum = UserRole(role.lower())
        dept = None
        if dept_code:
            dept = db.query(Department).filter(Department.code == dept_code.upper().strip()).first()
            if not dept:
                print(f"[WARNING] Department with code '{dept_code}' not found. Leaving unassigned.")

        user = User(
            name=name.strip(),
            email=email_clean,
            password_hash=hash_password(password),
            role=role_enum,
            account_status=UserStatus.ACTIVE,
            department_id=dept.id if dept else None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        log_audit_event(
            db,
            action="MUNICIPAL_USER_CREATED_CLI",
            entity_type="User",
            entity_id=user.id,
            actor_id=user.id,
            metadata={"role": user.role.value, "department": dept.name if dept else None}
        )

        print(f"[SUCCESS] Municipal account created successfully:")
        print(f"  ID: {user.id}")
        print(f"  Name: {user.name}")
        print(f"  Email: {user.email}")
        print(f"  Role: {user.role.value}")
        print(f"  Department: {dept.name if dept else 'None'}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to create municipal user: {e}")
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Civic Pulse Municipal User Provisioning CLI")
    parser.add_argument("--name", required=True, help="Full name of staff member")
    parser.add_argument("--email", required=True, help="Work email address")
    parser.add_argument("--password", required=True, help="Strong account password")
    parser.add_argument("--role", choices=["admin", "officer", "staff", "field_worker"], default="admin", help="Municipal privilege role")
    parser.add_argument("--dept", required=False, help="Department code (e.g. ROAD, LIGHT, DRAIN, WATER, WASTE, PW)")

    args = parser.parse_args()
    create_municipal_user(args.name, args.email, args.password, args.role, args.dept)


if __name__ == "__main__":
    main()
