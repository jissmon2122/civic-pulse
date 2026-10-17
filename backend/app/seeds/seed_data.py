import os
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models import (
    User, UserRole, UserStatus, Category, Report, ReportStatus, PriorityLevel,
    ReportHistory, Notification, Assignment, Department
)
from app.core.security import hash_password
from app.api.v1.reports import generate_public_reference
from app.ai.priority import compute_priority_score


DEMO_DEPARTMENTS = [
    ("Road Maintenance", "ROAD", "Road crater repair, resurfacing, asphalt works, and central divider maintenance", "roads@municipal.gov"),
    ("Drainage and Sewerage", "DRAIN", "Stormwater drains, sewer blockages, manhole repair, and flood mitigation", "drainage@municipal.gov"),
    ("Waste Management", "WASTE", "Solid waste collection, litter mitigation, dumping clearance, and container service", "waste@municipal.gov"),
    ("Street Lighting", "LIGHT", "Streetlamp electrical maintenance, pole repairs, dark street illumination, and cabling", "lighting@municipal.gov"),
    ("Public Works", "PW", "Public benches, footbridges, ramps, civic structures, and municipal buildings", "publicworks@municipal.gov"),
    ("Water Supply", "WATER", "Municipal pipeline maintenance, valve repairs, potable drinking water leak resolution", "water@municipal.gov")
]

DEMO_USERS = [
    {
        "name": "Jane Citizen (Demo)",
        "email": "citizen@civicpulse.org",
        "password": "DemoCitizen123!",
        "role": UserRole.CITIZEN,
        "phone_number": "+1-555-0101",
        "dept_code": None
    },
    {
        "name": "Alex Officer (Demo Staff)",
        "email": "staff@civicpulse.org",
        "password": "DemoStaff123!",
        "role": UserRole.STAFF,
        "phone_number": "+1-555-0102",
        "dept_code": "ROAD"
    },
    {
        "name": "Marcus Vance (Municipal Officer)",
        "email": "officer@civicpulse.org",
        "password": "DemoOfficer123!",
        "role": UserRole.OFFICER,
        "phone_number": "+1-555-0104",
        "dept_code": "LIGHT"
    },
    {
        "name": "Dave Miller (Field Worker)",
        "email": "worker@civicpulse.org",
        "password": "DemoWorker123!",
        "role": UserRole.FIELD_WORKER,
        "phone_number": "+1-555-0105",
        "dept_code": "ROAD"
    },
    {
        "name": "Sarah Commissioner (Demo Admin)",
        "email": "admin@civicpulse.org",
        "password": "DemoAdmin123!",
        "role": UserRole.ADMIN,
        "phone_number": "+1-555-0103",
        "dept_code": "PW"
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


def seed_database(include_demo_complaints: bool = False):
    """Seeds database with municipal departments, categories, and staff accounts. Real complaints are never fabricated."""
    print("Initializing Civic Pulse municipal database...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed or retrieve Departments
        dept_map = {}
        for d_name, d_code, d_desc, d_email in DEMO_DEPARTMENTS:
            existing_dept = db.query(Department).filter(Department.code == d_code).first()
            if not existing_dept:
                d = Department(name=d_name, code=d_code, description=d_desc, contact_email=d_email, is_active=True)
                db.add(d)
                db.commit()
                db.refresh(d)
                dept_map[d_code] = d
            else:
                dept_map[d_code] = existing_dept

        # 2. Seed or retrieve Categories
        category_map = {}
        for cat in db.query(Category).all():
            category_map[cat.name] = cat.id

        # 3. Seed Demo Users
        user_map = {}
        for u_data in DEMO_USERS:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            dept_obj = dept_map.get(u_data.get("dept_code"))
            dept_id = dept_obj.id if dept_obj else None
            if not existing:
                u = User(
                    name=u_data["name"],
                    email=u_data["email"],
                    password_hash=hash_password(u_data["password"]),
                    role=u_data["role"],
                    account_status=UserStatus.ACTIVE,
                    phone_number=u_data["phone_number"],
                    department_id=dept_id
                )
                db.add(u)
                db.commit()
                db.refresh(u)
                user_map[u.role] = u
            else:
                if dept_id and not existing.department_id:
                    existing.department_id = dept_id
                    db.commit()
                user_map[existing.role] = existing

        citizen = user_map[UserRole.CITIZEN]
        staff = user_map[UserRole.STAFF]
        officer = user_map.get(UserRole.OFFICER, staff)
        worker = user_map.get(UserRole.FIELD_WORKER, staff)
        admin = user_map[UserRole.ADMIN]

        # Department by Category mapping
        cat_to_dept = {
            "Broken streetlights": dept_map.get("LIGHT"),
            "Potholes and damaged roads": dept_map.get("ROAD"),
            "Water supply and leakage": dept_map.get("WATER"),
            "Garbage and waste management": dept_map.get("WASTE"),
            "Drainage and sewage": dept_map.get("DRAIN"),
            "Damaged public infrastructure": dept_map.get("PW"),
            "Public sanitation": dept_map.get("WASTE"),
            "Other civic issues": dept_map.get("PW")
        }

        # 4. Complaints are NOT seeded into production/active databases
        # Only genuine citizen complaints will be displayed.
        if include_demo_complaints:
            now = datetime.now(timezone.utc)
            for r_spec in SAMPLE_REPORTS:
                cat_id = category_map.get(r_spec["category_name"], 1)
                dept_for_cat = cat_to_dept.get(r_spec["category_name"])
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

                assigned_to = worker.id if r_spec["status"] in (ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS) else (staff.id if r_spec["status"] == ReportStatus.RESOLVED else None)
                due_date = created_time + timedelta(days=3) if assigned_to else None

                report = Report(
                    public_reference=generate_public_reference(),
                    title=r_spec["title"],
                    description=r_spec["desc"],
                    category_id=cat_id,
                    department_id=dept_for_cat.id if dept_for_cat else None,
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
                    due_date=due_date,
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
                    assign_assignee = worker if r_spec["status"] in (ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS) else staff
                    db.add(ReportHistory(
                        report_id=report.id,
                        changed_by=officer.id,
                        previous_status=ReportStatus.SUBMITTED,
                        new_status=ReportStatus.ASSIGNED,
                        public_comment=f"Assigned to {dept_for_cat.name if dept_for_cat else 'Department'} ({assign_assignee.name}).",
                        internal_note="Work order issued with 72-hour SLA.",
                        created_at=created_time + timedelta(hours=2)
                    ))
                    # Add Assignment entry
                    db.add(Assignment(
                        report_id=report.id,
                        department_id=dept_for_cat.id if dept_for_cat else None,
                        assigned_to=assign_assignee.id,
                        assigned_by=officer.id,
                        due_date=due_date,
                        instructions="Field inspection and standard repair according to municipal code.",
                        status="ACTIVE" if r_spec["status"] != ReportStatus.RESOLVED else "COMPLETED",
                        assigned_at=created_time + timedelta(hours=2)
                    ))

                if r_spec["status"] == ReportStatus.RESOLVED:
                    db.add(ReportHistory(
                        report_id=report.id,
                        changed_by=officer.id,
                        previous_status=ReportStatus.IN_PROGRESS,
                        new_status=ReportStatus.RESOLVED,
                        public_comment=r_spec.get("resolution_note", "Issue resolved and inspected."),
                        internal_note="Verified on-site by municipal inspector.",
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
        print("Initialization completed successfully. Real database active.")
    except Exception as e:
        print(f"Error initializing data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    with_demo = "--with-demo-reports" in sys.argv
    seed_database(include_demo_complaints=with_demo)
