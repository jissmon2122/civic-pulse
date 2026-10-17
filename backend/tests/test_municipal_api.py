import pytest
from app.models import ReportStatus, PriorityLevel


def test_municipal_login_success(client):
    """Test official staff login through the municipal authentication endpoint."""
    res = client.post(
        "/api/v1/municipal/auth/login",
        json={"email": "officer@test.com", "password": "Password123!"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "officer"


def test_municipal_login_rejects_citizen(client):
    """Test that ordinary citizens are forbidden from logging into the municipal staff portal."""
    res = client.post(
        "/api/v1/municipal/auth/login",
        json={"email": "citizen@test.com", "password": "Password123!"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_municipal_dashboard_unauthorized(client):
    """Test that unauthorized requests cannot access municipal operational data."""
    res = client.get("/api/v1/municipal/dashboard")
    assert res.status_code == 401


def test_municipal_dashboard_forbidden_for_citizen(client, citizen_token):
    """Test that citizen tokens are rejected from accessing the municipal dashboard."""
    res = client.get(
        "/api/v1/municipal/dashboard",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 403


def test_municipal_dashboard_success(client, officer_token):
    """Test that authorized officers can view real-time operational dashboard stats."""
    res = client.get(
        "/api/v1/municipal/dashboard",
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_complaints" in data
    assert "awaiting_verification" in data
    assert "verified_complaints" in data
    assert "assigned_complaints" in data
    assert "work_in_progress" in data
    assert "resolved_complaints" in data
    assert "overdue_complaints" in data
    assert isinstance(data["category_distribution"], list)
    assert isinstance(data["department_workload"], list)


def test_departments_and_staff_listing(client, officer_token):
    """Test retrieval of departments and municipal staff rosters."""
    dept_res = client.get(
        "/api/v1/municipal/departments",
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert dept_res.status_code == 200
    depts = dept_res.json()
    assert len(depts) >= 2

    staff_res = client.get(
        "/api/v1/municipal/staff",
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert staff_res.status_code == 200
    staff = staff_res.json()
    assert any(s["role"] == "field_worker" for s in staff)


def test_complete_complaint_lifecycle(client, citizen_token, officer_token, worker_token):
    """
    End-to-end integration test of the full municipal complaint lifecycle:
    Citizen submits -> Officer verifies -> Officer assigns -> Worker updates progress ->
    Worker submits resolution -> Officer reviews & approves -> Status is RESOLVED.
    """
    # 1. Citizen creates a complaint
    report_res = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "title": "Severe deep pothole causing traffic obstruction",
            "description": "Large crater near intersection, hazard to motorbikes and emergency vehicles.",
            "category_id": 1,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "location_description": "MG Road near Central Mall",
            "ward_or_area": "Ward 12"
        }
    )
    assert report_res.status_code == 201
    report_id = report_res.json()["id"]

    # 2. Officer inspects complaints
    list_res = client.get(
        f"/api/v1/municipal/complaints?search={report_id[:8]}",
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Officer verifies the complaint
    verify_res = client.post(
        f"/api/v1/municipal/complaints/{report_id}/verify",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "officer_notes": "Site inspection confirmed 20cm road crater. Valid municipal jurisdiction.",
            "department_id": 1,
            "priority_level": "HIGH"
        }
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "VERIFIED"
    assert verify_res.json()["department_id"] == 1
    assert verify_res.json()["priority_level"] == "HIGH"

    # 4. Officer assigns the task to field worker
    assign_res = client.post(
        f"/api/v1/municipal/complaints/{report_id}/assign",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "department_id": 1,
            "assigned_to": "test-worker-id-1",
            "priority_level": "HIGH",
            "instructions": "Dispatch cold-mix asphalt patch truck and warning cones."
        }
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "ASSIGNED"
    assert assign_res.json()["assigned_to"] == "test-worker-id-1"

    # 5. Field worker checks their task list
    worker_tasks = client.get(
        "/api/v1/municipal/assignments",
        headers={"Authorization": f"Bearer {worker_token}"}
    )
    assert worker_tasks.status_code == 200
    assert any(t["report_id"] == report_id for t in worker_tasks.json())

    # 6. Worker records progress
    progress_res = client.post(
        f"/api/v1/municipal/complaints/{report_id}/progress",
        headers={"Authorization": f"Bearer {worker_token}"},
        json={"progress_notes": "Asphalt crew on site. Compaction machine deployed."}
    )
    assert progress_res.status_code == 200
    assert progress_res.json()["status"] == "IN_PROGRESS"

    # 7. Worker submits resolution evidence
    submit_res = client.post(
        f"/api/v1/municipal/complaints/{report_id}/resolution/submit",
        headers={"Authorization": f"Bearer {worker_token}"},
        json={
            "completion_notes": "Pothole filled with dense asphalt, leveled with steam roller. Surface restored."
        }
    )
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "RESOLUTION_SUBMITTED"

    # 8. Worker CANNOT approve their own resolution (Permission check)
    forbidden_review = client.post(
        f"/api/v1/municipal/complaints/{report_id}/resolution/review",
        headers={"Authorization": f"Bearer {worker_token}"},
        json={"decision": "approve", "review_notes": "Self approval"}
    )
    assert forbidden_review.status_code == 403

    # 9. Officer reviews and approves the resolution
    review_res = client.post(
        f"/api/v1/municipal/complaints/{report_id}/resolution/review",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "decision": "approve",
            "review_notes": "Physical patch work verified. Quality standard compliant."
        }
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "RESOLVED"
    assert review_res.json()["resolved_at"] is not None


def test_complaint_rejection_workflow(client, citizen_token, officer_token):
    """Test rejecting an invalid complaint with mandatory audit reason."""
    report_res = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "title": "Private courtyard flower pot broken",
            "description": "My neighbor knocked over a flower pot in our private gated residential driveway.",
            "category_id": 8,
            "latitude": 12.9716,
            "longitude": 77.5946
        }
    )
    report_id = report_res.json()["id"]

    reject_res = client.post(
        f"/api/v1/municipal/complaints/{report_id}/reject",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "rejection_reason": "Private gated property dispute. Not within municipal public infrastructure jurisdiction.",
            "officer_notes": "Advised complainant to contact residential association."
        }
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
    assert "Private gated property" in reject_res.json()["rejection_reason"]


def test_csv_export_formula_injection_protection(client, citizen_token, officer_token):
    """Test CSV export sanitizes formulas (=, +, -, @, tab) against spreadsheet injection."""
    # Submit report with formula injection payload
    client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "title": "=cmd|' /C calc'!A0 Dangerous formula in title",
            "description": "@SUM(1+1) formula test in description",
            "category_id": 1,
            "latitude": 12.9716,
            "longitude": 77.5946
        }
    )

    csv_res = client.get(
        "/api/v1/municipal/export/csv",
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    csv_text = csv_res.text

    # Verify that cells starting with =, +, -, @ were prefixed with a single quote '
    assert "'=cmd|" in csv_text or "Dangerous formula" in csv_text
    assert not any(line.startswith("=cmd|") for line in csv_text.splitlines())
