# CIVIC PULSE: API Documentation

Base URL: `/api/v1`  
Interactive OpenAPI UI: `http://localhost:8000/docs`  
ReDoc UI: `http://localhost:8000/redoc`

---

## 1. Authentication & Users

### `POST /auth/register`
Registers a new citizen account. Role is strictly enforced as `citizen`.
- **Request Body**:
  ```json
  {
    "name": "Jane Citizen",
    "email": "jane@example.com",
    "password": "SecurePassword123!",
    "phone_number": "+1-555-0101"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "name": "Jane Citizen",
      "email": "jane@example.com",
      "role": "citizen",
      "account_status": "active",
      "created_at": "2026-10-17T08:00:00Z"
    }
  }
  ```

### `POST /auth/login`
Authenticates a user and issues a Bearer JWT.
- **Request Body**: `{"email": "citizen@civicpulse.local", "password": "DemoCitizen123!"}`
- **Response** (`200 OK`): Token and user profile object.

### `GET /auth/me`
Retrieves authenticated user profile. Requires `Authorization: Bearer <token>`.

### `PATCH /auth/profile`
Updates name or phone number. Requires `Authorization: Bearer <token>`.

---

## 2. Reports Management

### `POST /reports`
Submits a new civic issue report. Triggers AI classification validation, priority scoring, duplicate detection, and notification dispatch.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "title": "Severe pothole cluster near hospital entrance",
    "description": "Deep asphalt crater on inbound lane causing traffic swerves.",
    "category_id": 1,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "location_description": "Corner of 5th Main & 8th Cross",
    "ward_or_area": "Ward 42 - Central"
  }
  ```
- **Response** (`201 Created`): Complete report object with public tracking reference (e.g. `CP-2026-AB12C`).

### `GET /reports`
Lists public complaints with filtering and privacy coordinate rounding (~100m).
- **Query Parameters**:
  - `search`: string keyword filter.
  - `category_id`: integer category ID.
  - `status`: `SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
  - `priority_level`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `page`: integer (default 1).
  - `page_size`: integer (default 20, max 100).

### `GET /reports/map`
Lightweight geographic pins payload for OpenStreetMap rendering.

### `GET /reports/{id}`
Full details for a specific report. Strips internal staff notes for non-staff viewers.

### `POST /reports/{id}/images`
Uploads and attaches an image. Strips EXIF/GPS metadata using Pillow before saving.
- **Form Data**: `file` (image/jpeg, image/png, image/webp; max 5MB).
- **Query Parameter**: `is_resolution_evidence` (boolean, staff only).

### `POST /reports/{id}/reopen`
Allows reporting citizen or staff to flag a resolved issue as unresolved with reasons.

---

## 3. AI & Geospatial Endpoints

### `POST /ai/classify`
- **Request**: `{"title": "Broken lamp", "description": "Dark street at night"}`
- **Response**:
  ```json
  {
    "suggested_category": "Broken streetlights",
    "confidence": 0.88,
    "model_version": "v1.0.0-tfidf-logreg",
    "method": "machine_learning",
    "needs_human_review": false,
    "explanation": "Statistical text classification with 88.0% probability confidence."
  }
  ```

### `POST /ai/duplicates/check`
- **Request**: `{"title": "...", "description": "...", "latitude": 12.97, "longitude": 77.59, "category_id": 1}`
- **Response**: Total analyzed candidates and ranked duplicate candidates within 150m.

### `POST /ai/priority/explain`
- **Request**: `{"title": "...", "description": "...", "category_name": "..."}`
- **Response**: Numeric score, level, contributing factors, and emergency guidance.

### `GET /ai/metrics`
Returns actual measured test metrics on held-out evaluation dataset.

---

## 4. Municipal Staff Endpoints

### `GET /staff/reports`
Operational queue for triage with optional filters (`assigned_only`, `status_filter`, `priority_filter`). Requires `staff` or `admin` role.

### `POST /staff/reports/{id}/status`
Transitions workflow state. Requires mandatory resolution comment for `RESOLVED`.

### `POST /staff/reports/{id}/assign`
Assigns report to a field staff member.

### `GET /staff/workload`
Returns unassigned queue, active cases, and critical pending counts.

---

## 5. System Administration & Analytics

### `GET /admin/users` & `PATCH /admin/users/{id}/role`
User and role administration.

### `GET /admin/audit-logs`
Audit log inspection trail.

### `GET /analytics/overview`
High-level resolution KPIs (total, open, resolved, average hours, critical overdue).

### `GET /analytics/hotspots`
Geospatial density clusters computed via grid aggregation.
