import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models import User, UserRole, UserStatus, Category
from app.core.security import hash_password, create_access_token

# Use an isolated in-memory or file-based SQLite database for automated tests
TEST_DATABASE_URL = "sqlite:///./test_civic_pulse.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Seed test categories
    db = TestingSessionLocal()
    categories = [
        ("Potholes and damaged roads", "Road craters and cracks"),
        ("Garbage and waste management", "Trash and overflowing bins"),
        ("Drainage and sewage", "Clogged drains and manholes"),
        ("Water supply and leakage", "Burst pipes and leaks"),
        ("Broken streetlights", "Dark streets and broken lamps"),
        ("Damaged public infrastructure", "Broken public benches and bridges"),
        ("Public sanitation", "Dirty public restrooms"),
        ("Other civic issues", "Other issues")
    ]
    for idx, (name, desc) in enumerate(categories, start=1):
        db.add(Category(id=idx, name=name, description=desc, icon_name="AlertCircle", color_hint="#0E7C86", is_active=True))

    from app.models import Department
    dept_road = Department(id=1, name="Road Maintenance", code="ROAD", description="Road works", contact_email="roads@test.com", is_active=True)
    dept_light = Department(id=2, name="Street Lighting", code="LIGHT", description="Street lighting", contact_email="lighting@test.com", is_active=True)
    db.add_all([dept_road, dept_light])
    db.commit()

    # Seed test accounts
    citizen = User(
        id="test-citizen-id-1",
        name="Test Citizen",
        email="citizen@test.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
        account_status=UserStatus.ACTIVE
    )
    staff = User(
        id="test-staff-id-1",
        name="Test Staff",
        email="staff@test.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.STAFF,
        department_id=1,
        account_status=UserStatus.ACTIVE
    )
    officer = User(
        id="test-officer-id-1",
        name="Test Officer",
        email="officer@test.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.OFFICER,
        department_id=1,
        account_status=UserStatus.ACTIVE
    )
    worker = User(
        id="test-worker-id-1",
        name="Test Worker",
        email="worker@test.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.FIELD_WORKER,
        department_id=1,
        account_status=UserStatus.ACTIVE
    )
    admin = User(
        id="test-admin-id-1",
        name="Test Admin",
        email="admin@test.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.ADMIN,
        account_status=UserStatus.ACTIVE
    )
    db.add_all([citizen, staff, officer, worker, admin])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def citizen_token():
    return create_access_token(subject="test-citizen-id-1", role=UserRole.CITIZEN.value)


@pytest.fixture
def staff_token():
    return create_access_token(subject="test-staff-id-1", role=UserRole.STAFF.value)


@pytest.fixture
def officer_token():
    return create_access_token(subject="test-officer-id-1", role=UserRole.OFFICER.value)


@pytest.fixture
def worker_token():
    return create_access_token(subject="test-worker-id-1", role=UserRole.FIELD_WORKER.value)


@pytest.fixture
def admin_token():
    return create_access_token(subject="test-admin-id-1", role=UserRole.ADMIN.value)
