import os
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models import (
    User, UserRole, UserStatus, Category, Report, ReportStatus, PriorityLevel,
    ReportHistory, Notification, Assignment
)
from app.core.security import hash_password
from app.api.v1.reports import generate_public_reference
from app.ai.priority import compute_priority_score


DEMO_USERS = [
    {
        "name": "Jane Citizen (Demo)",
        "email": "citizen@civicpulse.local",
        "password": "DemoCitizen123!",
        "role": UserRole.CITIZEN,
        "phone_number": "+1-555-0101"
    },
    {
        "name": "Alex Officer (Demo Staff)",
        "email": "staff@civicpulse.local",
        "password": "DemoStaff123!",
        "role": UserRole.STAFF,
        "phone_number": "+1-555-0102"
    },
    {
        "name": "Sarah Commissioner (Demo Admin)",
        "email": "admin@civicpulse.local",
        "password": "DemoAdmin123!",
        "role": UserRole.ADMIN,
        "phone_number": "+1-555-0103"
    }
]

SAMPLE_REPORTS = [
    {
        "title": "Exposed high-voltage wires from bent streetlight pole",
        "desc": "Lamppost struck by delivery vehicle, wires sparking near children's pedestrian pathway. Urgent safety hazard.",
        "category_name": "Broken streetlights",
        "lat": 12.9716, "lon": 77.5946,
        "location_desc": "Corner of 5th Main & 8th Cross, Ward 42",
        "ward": "Ward 42 - Central",
        "status": ReportStatus.ASSIGNED,
        "age_days": 1
    },
    {
        "title": "Severe pothole cluster damaging car suspensions",
        "desc": "Deep crater spanning across both inbound lanes. Multiple motorbikes have swerved into oncoming traffic to avoid it.",
        "category_name": "Potholes and damaged roads",
        "lat": 12.9750, "lon": 77.5980,
        "location_desc": "Near Central Metro Station Exit B",
        "ward": "Ward 42 - Central",
        "status": ReportStatus.IN_PROGRESS,
        "age_days": 3
    },
    {
        "title": "Main drinking water pipe burst flooding roadway",
        "desc": "Clean water pipeline ruptured underground, high pressure jet flooding the asphalt and draining into storm sewer.",
        "category_name": "Water supply and leakage",
        "lat": 12.9690, "lon": 77.6010,
        "location_desc": "In front of Community Health Clinic, Ward 44",
        "ward": "Ward 44 - South Market",
        "status": ReportStatus.SUBMITTED,
        "age_days": 0
    },
    {
        "title": "Overflowing waste dumpster attracting stray animals",
        "desc": "Municipal container has not been cleared for three days. Debris spilled across sidewalk and street.",
        "category_name": "Garbage and waste management",
        "lat": 12.9780, "lon": 77.5920,
        "location_desc": "Behind Vegetable Market Complex, Ward 41",
        "ward": "Ward 41 - North Bazaar",
        "status": ReportStatus.RESOLVED,
        "age_days": 5,
        "resolved_hours_after": 36,
        "resolution_note": "Municipal sanitation crew dispatched with hydraulic compactor truck. Site sanitized with lime powder."
    },
    {
        "title": "Stormwater drain completely blocked with silt and plastic",
        "desc": "Monsoon drain choked causing ankle-deep waterlogging whenever it rains lightly.",
        "category_name": "Drainage and sewage",
        "lat": 12.9735, "lon": 77.6050,
        "location_desc": "Outer Ring Road Junction 12",
        "ward": "Ward 43 - Tech Corridor",
        "status": ReportStatus.UNDER_REVIEW,
        "age_days": 2
    },
    {
        "title": "Broken wheelchair accessibility ramp at civil library",
        "desc": "Concrete ramp edge cracked and broken, rebar exposed preventing wheelchair access for disabled citizens.",
        "category_name": "Damaged public infrastructure",
        "lat": 12.9650, "lon": 77.5960,
        "location_desc": "Municipal Public Library Main Entrance",
        "ward": "Ward 42 - Central",
        "status": ReportStatus.IN_PROGRESS,
        "age_days": 4
    },
    {
        "title": "Public restroom facility water tap broken and doors missing",
        "desc": "Severe unhygienic conditions inside public lavatory outside transit terminal.",
        "category_name": "Public sanitation",
        "lat": 12.9720, "lon": 77.5890,
        "location_desc": "Platform 3 Bus Terminal Entrance",
        "ward": "Ward 41 - North Bazaar",
        "status": ReportStatus.RESOLVED,
        "age_days": 7,
        "resolved_hours_after": 48,
        "resolution_note": "New plumbing fittings installed, latch hardware replaced, and deep sanitization completed."
    },
    {
        "title": "Dead eucalyptus tree branch dangling over pedestrian path",
        "desc": "Large dry branch cracked during thunderstorm, hanging precariously over footpath.",
        "category_name": "Other civic issues",
        "lat": 12.9805, "lon": 77.6015,
        "location_desc": "Queen's Park North Gate",
        "ward": "Ward 43 - Tech Corridor",
        "status": ReportStatus.ASSIGNED,
        "age_days": 1
    }
]


def seed_database():
    """Seeds database with realistic, clearly labeled fictional demo data."""
    print("Seeding database with demo data...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed or retrieve Categories
        category_map = {}
        for cat in db.query(Category).all():
            category_map[cat.name] = cat.id

        # 2. Seed Demo Users
        user_map = {}
        for u_data in DEMO_USERS:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                u = User(
                    name=u_data["name"],
                    email=u_data["email"],
                    password_hash=hash_password(u_data["password"]),
                    role=u_data["role"],
                    account_status=UserStatus.ACTIVE,
                    phone_number=u_data["phone_number"]
                )
                db.add(u)
                db.commit()
                db.refresh(u)
                user_map[u.role] = u
            else:
                user_map[existing.role] = existing

        citizen = user_map[UserRole.CITIZEN]
        staff = user_map[UserRole.STAFF]
        admin = user_map[UserRole.ADMIN]

        # 3. Seed Demo Reports
        now = datetime.now(timezone.utc)
        for r_spec in SAMPLE_REPORTS:
            cat_id = category_map.get(r_spec["category_name"], 1)
            created_time = now - timedelta(days=r_spec["age_days"])
            
            # Check if similar report already seeded
            existing_report = db.query(Report).filter(Report.title == r_spec["title"]).first()
            if existing_report:
                continue

            priority = compute_priority_score(
                title=r_spec["title"],
                description=r_spec["desc"],
                category_name=r_spec["category_name"],
                created_at=created_time,
                duplicate_count=0
            )

            resolved_at = None
            if r_spec["status"] in (ReportStatus.RESOLVED, ReportStatus.CLOSED):
                resolved_at = created_time + timedelta(hours=r_spec.get("resolved_hours_after", 24))

            assigned_to = staff.id if r_spec["status"] in (ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED) else None

            report = Report(
                public_reference=generate_public_reference(),
                title=r_spec["title"],
                description=r_spec["desc"],
                category_id=cat_id,
                ai_suggested_category=r_spec["category_name"],
                ai_confidence=0.88,
                needs_human_review=False,
                reported_by=citizen.id,
                latitude=r_spec["lat"],
                longitude=r_spec["lon"],
                location_description=r_spec["location_desc"],
                ward_or_area=r_spec["ward"],
                status=r_spec["status"],
                priority_score=priority["score"],
                priority_level=priority["priority_level"],
                priority_explanation=" | ".join(priority["factors"]),
                assigned_to=assigned_to,
                created_at=created_time,
                updated_at=created_time + timedelta(hours=2),
                resolved_at=resolved_at
            )
            db.add(report)
            db.commit()
            db.refresh(report)

            # History
            db.add(ReportHistory(
                report_id=report.id,
                changed_by=citizen.id,
                previous_status=None,
                new_status=ReportStatus.SUBMITTED,
                public_comment="Initial report submitted with location pin.",
                created_at=created_time
            ))

            if r_spec["status"] in (ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED):
                db.add(ReportHistory(
                    report_id=report.id,
                    changed_by=staff.id,
                    previous_status=ReportStatus.SUBMITTED,
                    new_status=ReportStatus.ASSIGNED,
                    public_comment=f"Assigned to field team ({staff.name}).",
                    internal_note="Dispatched priority work order to maintenance depot.",
                    created_at=created_time + timedelta(hours=2)
                ))

            if r_spec["status"] == ReportStatus.RESOLVED:
                db.add(ReportHistory(
                    report_id=report.id,
                    changed_by=staff.id,
                    previous_status=ReportStatus.IN_PROGRESS,
                    new_status=ReportStatus.RESOLVED,
                    public_comment=r_spec.get("resolution_note", "Issue resolved and inspected."),
                    created_at=resolved_at or now
                ))

            # Notification for citizen
            db.add(Notification(
                recipient_id=citizen.id,
                report_id=report.id,
                title=f"Update on #{report.public_reference}",
                message=f"Status: {report.status.value}. {r_spec.get('resolution_note', 'Your report is being processed.')}",
                created_at=now - timedelta(hours=1)
            ))

        db.commit()
        print("Demo data seeded successfully.")
    except Exception as e:
        print(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
