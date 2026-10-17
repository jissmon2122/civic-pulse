import pytest
from app.models import ReportStatus, UserRole


def test_health_and_readiness(client):
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"

    r_ready = client.get("/api/v1/ready")
    assert r_ready.status_code == 200
    assert r_ready.json()["status"] == "ready"


def test_auth_registration_and_login(client):
    # Register new citizen
    reg_payload = {
        "name": "New Citizen User",
        "email": "newcitizen@example.com",
        "password": "SecurePassword123!",
        "phone_number": "+1-555-9876"
    }
    r_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert r_reg.status_code == 201
    reg_data = r_reg.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["role"] == "citizen"  # Always citizen

    # Login
    login_payload = {
        "email": "newcitizen@example.com",
        "password": "SecurePassword123!"
    }
    r_login = client.post("/api/v1/auth/login", json=login_payload)
    assert r_login.status_code == 200
    assert "access_token" in r_login.json()


def test_create_report_and_verify_persistence(client, citizen_token):
    headers = {"Authorization": f"Bearer {citizen_token}"}
    report_data = {
        "title": "Large pothole outside government school",
        "description": "Deep asphalt depression causing school buses to halt abruptly. Heavy safety concern.",
        "category_id": 1,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "location_description": "Main gate of School",
        "ward_or_area": "Ward 42"
    }
    r = client.post("/api/v1/reports", json=report_data, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["public_reference"].startswith("CP-2026-")
    assert data["status"] == "SUBMITTED"
    assert data["priority_level"] in ("MEDIUM", "HIGH", "CRITICAL")
    assert len(data["history"]) >= 1

    report_id = data["id"]

    # Public list check
    r_list = client.get("/api/v1/reports")
    assert r_list.status_code == 200
    public_reports = r_list.json()
    assert any(item["id"] == report_id for item in public_reports)

    # Verify no private reporter email in public item
    for item in public_reports:
        assert "reporter_email" not in item


def test_staff_workflow_and_resolution(client, citizen_token, staff_token):
    # 1. Citizen creates report
    headers_citizen = {"Authorization": f"Bearer {citizen_token}"}
    rep_res = client.post("/api/v1/reports", json={
        "title": "Broken street lamp sparking continuously",
        "description": "Sparking light pole on residential avenue",
        "category_id": 5,
        "latitude": 12.9750,
        "longitude": 77.5980
    }, headers=headers_citizen)
    assert rep_res.status_code == 201
    rep_id = rep_res.json()["id"]

    headers_staff = {"Authorization": f"Bearer {staff_token}"}

    # 2. Staff transitions to UNDER_REVIEW
    r_review = client.post(f"/api/v1/staff/reports/{rep_id}/status", json={
        "new_status": "UNDER_REVIEW",
        "public_comment": "Reviewing complaint with engineering unit."
    }, headers=headers_staff)
    assert r_review.status_code == 200
    assert r_review.json()["status"] == "UNDER_REVIEW"

    # 3. Staff transitions to IN_PROGRESS
    r_prog = client.post(f"/api/v1/staff/reports/{rep_id}/status", json={
        "new_status": "IN_PROGRESS",
        "public_comment": "Electrical repair crew on site."
    }, headers=headers_staff)
    assert r_prog.status_code == 200
    assert r_prog.json()["status"] == "IN_PROGRESS"

    # 4. Staff transitions to RESOLVED with mandatory resolution note
    r_res = client.post(f"/api/v1/staff/reports/{rep_id}/status", json={
        "new_status": "RESOLVED",
        "public_comment": "Wiring replaced and luminaire fixture repaired. Tested safely."
    }, headers=headers_staff)
    assert r_res.status_code == 200
    assert r_res.json()["status"] == "RESOLVED"
    assert r_res.json()["resolved_at"] is not None


def test_security_rbac_enforcement(client, citizen_token, staff_token):
    headers_citizen = {"Authorization": f"Bearer {citizen_token}"}

    # Citizen trying to access staff reports endpoint must be forbidden
    r_staff = client.get("/api/v1/staff/reports", headers=headers_citizen)
    assert r_staff.status_code == 403

    # Citizen trying to access admin users endpoint must be forbidden
    r_admin = client.get("/api/v1/admin/users", headers=headers_citizen)
    assert r_admin.status_code == 403

    # Staff trying to access admin endpoints must be forbidden
    headers_staff = {"Authorization": f"Bearer {staff_token}"}
    r_admin_by_staff = client.get("/api/v1/admin/users", headers=headers_staff)
    assert r_admin_by_staff.status_code == 403

    # Invalid token check
    r_invalid_token = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert r_invalid_token.status_code == 401


def test_analytics_endpoints(client):
    r_overview = client.get("/api/v1/analytics/overview")
    assert r_overview.status_code == 200
    data = r_overview.json()
    assert "total_reports" in data
    assert "resolution_rate_percent" in data

    r_cats = client.get("/api/v1/analytics/categories")
    assert r_cats.status_code == 200
    assert isinstance(r_cats.json(), list)

    r_hotspots = client.get("/api/v1/analytics/hotspots")
    assert r_hotspots.status_code == 200
    assert "hotspots" in r_hotspots.json()
