# CIVIC PULSE
### AI-Powered Civic Issue Reporting, Intelligence, Prioritization & Resolution Platform
**UI/UX Design System:** *"Daylight Civic"* (Warm day theme, accessible, mobile-first)

---

## 1. Executive Summary & Vision

**CIVIC PULSE** connects citizens and authorized municipal personnel through a transparent, explainable public-issue resolution platform. Citizens report civic infrastructure hazards (potholes, burst pipelines, broken streetlights, overflowing waste), upload photographs, pin locations on interactive maps, and track the status journey of their complaints in real time.

The platform uses statistical NLP classification, multi-signal duplicate detection, explainable priority scoring, and geodesic density analytics to help cities organize and resolve complaints efficiently.

> **Academic & Civic Integrity Notice:** CIVIC PULSE is a transparent decision-support system. It is not an officially connected municipal department unless authorized integrations are configured. It never fabricates metrics, claims false government affiliations, or hides model failure states.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, React Router 6, Tailwind CSS ("Daylight Civic" color tokens), Leaflet & React-Leaflet, OpenStreetMap, Recharts, Lucide Icons.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL / SQLite engine with Haversine spatial math, Pytest, PyJWT, bcrypt.
- **AI / Data**: scikit-learn (`TfidfVectorizer`, multinomial `LogisticRegression`), NumPy, Pandas, Pillow (EXIF metadata sanitization).
- **Security**: Strict server-side RBAC, EXIF stripping, sliding-window rate limiting, ORM parameterization, location coordinate anonymization.

---

## 3. System Architecture & Workflows

### 3.1 Architecture Overview
```mermaid
flowchart TD
    Citizen["Citizen Browser"] -->|Vite React Client| UI["Daylight Civic UI"]
    UI -->|JWT Bearer / REST| API["FastAPI Backend (/api/v1)"]
    API --> Security["Security & RBAC Layer"]
    Security --> AI["AI & Geospatial Engine"]
    AI --> NLP["TF-IDF Classification"]
    AI --> Dup["Haversine + Cosine Deduplication"]
    AI --> Pri["Explainable Priority Scoring"]
    API --> DB[("PostgreSQL / SQLite Database")]
    API --> Storage["EXIF-Sanitized Image Store"]
```

### 3.2 State Machine Resolution Pipeline
```text
[SUBMITTED] ---> [UNDER_REVIEW] ---> [ASSIGNED] ---> [IN_PROGRESS] ---> [RESOLVED] ---> [CLOSED]
       |                |                                                  ^
       |                +--------> [NEEDS_INFORMATION]                     | (Citizen Reopen)
       +--------> [REJECTED]                                               +------------------+
```

---

## 4. Key AI Capabilities & Actual Evaluation Results

| AI Feature | Methodology | Evaluation Metric / Output |
| :--- | :--- | :--- |
| **Issue Classification** | Unigram + bigram TF-IDF with multinomial Logistic Regression & rule-based fallback | **58.33% Accuracy**, **0.5708 Macro F1** on stratified 25% held-out test split. Confidence $< 0.65$ routes to human staff review. |
| **Duplicate Detection** | Multi-signal composite: $50\%$ text similarity (Jaccard + TF-IDF) + $30\%$ Haversine proximity ($< 150$m) + $20\%$ category match | Flags nearby matching complaints to prevent duplicate work orders without merging distinct issues. |
| **Priority Scoring** | Transparent 5-factor weighted formula: Safety ($35\%$), Severity ($25\%$), Age ($20\%$), Accessibility ($10\%$), Duplicates ($10\%$) | Outputs explainable reasons and displays immediate emergency dispatch guidance (112 / 911) if danger triggers. |

---

## 5. Quick Start & Installation

### 5.1 Prerequisites
- Python 3.12+ (or `uv` package manager)
- Node.js 18+ and `npm`

### 5.2 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment and install dependencies
uv venv .venv --python 3.12
.\.venv\Scripts\activate
uv pip install -r requirements.txt   # or uv pip install fastapi uvicorn ...

# Run AI training script (compiles model bundle and saves evaluation metrics)
python -m app.ai.train

# Apply database schema migrations (Alembic)
alembic upgrade head

# Seed database with realistic demo accounts and sample reports
python -m app.seeds.seed_data

# Run backend automated test suite (21 tests, 100% passing)
python -m pytest -v

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### 5.3 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

---

## 6. Municipal Staff & Operations Portal

A dedicated, secure municipal operations portal is integrated under `/municipal/*` with isolated government-service layout, role-based workflows, and department dispatching.

### 6.1 Municipal Routes
- `/municipal/login`: Dedicated municipal authentication portal with 1-click evaluation shortcuts.
- `/municipal/dashboard`: Executive operations dashboard with 8 real-time KPI metric counters, urgent triage queue, overdue resolution tracking, department workload distribution, and 14-day complaint intake vs. resolution trends.
- `/municipal/complaints`: Searchable complaints grid supporting status, priority, department, and overdue filtering, keyword/reference search, and formula-injection-sanitized CSV export.
- `/municipal/complaints/:id`: Officer investigation workstation featuring interactive Leaflet geolocations, citizen photo evidence, full status timeline, and modal workflows (Verify, Reject with mandatory reason, Dispatch & Assign, Progress updates, Resolution Evidence upload, Officer review & closure).
- `/municipal/assignments`: Field crew work queue displaying active work orders, SLA countdowns, repair logging, and completion photo uploads.
- `/municipal/analytics`: Resolution rate statistics, average resolution latency, department capacity matrix, and immutable audit logs.
- `/municipal/profile`: Authenticated staff profile with department affiliation, contact settings, and municipal data handling guidelines.

### 6.2 Seed Accounts & Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Municipal Officer** | `officer@civicpulse.org` | `DemoOfficer123!` | Verify/reject complaints, assign to departments & field crew, review and approve resolutions. |
| **Field Repair Crew** | `worker@civicpulse.org` | `DemoWorker123!` | Access assigned work orders, post repair progress updates, submit resolution evidence. |
| **Municipal Admin** | `admin@civicpulse.org` | `DemoAdmin123!` | Manage departments, staff directory, system-wide metrics, and audit logs. |
| **General Staff** | `staff@civicpulse.org` | `DemoStaff123!` | Operational complaint triage and internal annotations. |
| **Citizen Complainant** | `citizen@civicpulse.org` | `DemoCitizen123!` | Citizen reporting, interactive map, track submissions (strictly blocked from `/municipal/*` with 403 Forbidden). |

*(Demo accounts can be auto-filled with 1 click on the respective Citizen and Municipal sign-in pages)*

### 6.3 Secure Municipal Account Provisioning (CLI)
Municipal staff accounts cannot be registered through public endpoints. Provision officers and admins securely via the administrative CLI:
```bash
python -m app.cli.create_admin --name "Chief Road Inspector" --email "officer.roads@municipal.gov" --password "SecureOfficer123!" --role officer --dept ROAD
```

---

## 7. Automated Test Results
 
The backend contains 30 automated tests verifying unit calculations, security boundaries, and API workflows:
- **Municipal Portal Tests (9 tests)**:
  - `test_municipal_login_success`: Validates JWT issue and role permissions for municipal staff.
  - `test_municipal_login_rejects_citizen`: Blocks citizen accounts from authenticating at the municipal endpoint.
  - `test_municipal_dashboard_unauthorized`: Validates 401 Unauthorized for unauthenticated dashboard requests.
  - `test_municipal_dashboard_forbidden_for_citizen`: Enforces 403 Forbidden when a valid citizen token attempts municipal access.
  - `test_municipal_dashboard_success`: Verifies all 8 database KPI metrics, queues, and workload stats.
  - `test_departments_and_staff_listing`: Verifies active department queries and staff assignment metrics.
  - `test_complete_complaint_lifecycle`: End-to-end workflow: citizen submission &rarr; officer verification &rarr; department dispatch &rarr; field crew progress logging &rarr; resolution photo evidence &rarr; officer review approval &rarr; resolution timestamps.
  - `test_complaint_rejection_workflow`: Rejection with mandatory audit trail explanation.
  - `test_csv_export_formula_injection_protection`: Verifies leading `=`, `+`, `-`, `@`, `\t`, `\r` are escaped with `'` against spreadsheet injection.
- **Database & Migration Tests**: Alembic fresh SQLite/PostgreSQL schema creation, table reflection, and column constraints.
- **Geospatial Tests**: Haversine distance accuracy, privacy coordinate rounding, grid clustering.
- **AI & Deduplication Tests**: Normalization, keyword fallback, ML probability prediction, zero train-test leakage verification, confusion matrix generation, boundary duplicate detection (111m vs 333m).
- **Priority Scoring Tests**: Multi-factor calculations, aging escalation (14 days), duplicate demand amplification, emergency hazard escalation.
- **Workflow Tests**: Permitted and prohibited status transitions; citizen cannot resolve own report.
- **Security & RBAC Tests**: Citizen cannot access staff/admin routes (403 Forbidden), invalid tokens rejected (401 Unauthorized), role elevation via registration rejected, reporter private data hidden from strangers.

**Result**: `30 passed, 1 warning in 7.09s` (100% pass rate, 0 failures).

---

## 8. Independent Verification Audit Findings

| Category | Verified Status | Measured Results & Notes |
| :--- | :--- | :--- |
| **Migrations** | VERIFIED | Alembic configured with autogenerated migration `c769107fa795_add_departments_and_municipal_workflow`. Fresh database test dynamically verified via pytest. |
| **DB Portability** | VERIFIED | All `SQLEnum` definitions use `native_enum=False` to ensure SQLite and PostgreSQL dialect compatibility without type collisions. Datetime subtractions normalized with `_to_utc()`. |
| **Classification AI** | VERIFIED BASELINE | 48 total samples (6 per category, 8 categories, uniform 12.5% balance). Stratified 25% test split (12 samples) yields **58.33% Accuracy** and **0.5708 Macro F1**. Zero data leakage between train and test. Low-confidence fallback routes to human review. |
| **Duplicate Detection** | VERIFIED | Multi-signal metric combining Jaccard, TF-IDF cosine similarity, and Haversine distance ($< 150$m). Boundaries verified at 111m (detected) and 333m (pruned). |
| **Priority Engine** | VERIFIED | Deterministic 5-factor scoring ($0.35, 0.25, 0.20, 0.10, 0.10$). Emergency hazard keywords trigger immediate critical priority and emergency guidance. Aging and duplicate counts dynamically increase priority. |
| **Authentication & RBAC** | VERIFIED | Passwords hashed with bcrypt; JWT access tokens; server-side RBAC on every protected route; registration role elevation strictly rejected. Citizens blocked (HTTP 403) from municipal portal endpoints. |
| **Upload Security** | VERIFIED | Pillow file verification, max 5MB size limit, EXIF/GPS stripping via fresh re-encoding, randomized UUID storage keys. |
| **Privacy Protection** | VERIFIED | Coordinate coarsening to ~100m on public endpoints; reporter name and email withheld from public view. |
| **CSV Security** | VERIFIED | Formula injection sanitization on CSV exports prevents CSV/Excel command execution attacks. |
| **Frontend Production Build** | VERIFIED | Vite production build compiles cleanly (`tsc -b && vite build` &rarr; 0 errors, HTML 1.41 kB, CSS 59.03 kB, JS 996.82 kB). |

---

## 9. Technical Interview Preparation (25 Key Questions & Answers)

<details>
<summary><strong>1. Why did you choose a service-oriented modular monolith over microservices?</strong></summary>
A modular monolith with clear service boundaries (Reports, AI, Geo, Workflow, Auth) provides strong transactional consistency across state transitions while avoiding distributed transaction complexity, network latency, and operational overhead typical of early-stage systems.
</details>

<details>
<summary><strong>2. How is Role-Based Access Control (RBAC) enforced?</strong></summary>
RBAC is enforced server-side on every protected endpoint using FastAPI dependency injection (`get_current_staff_or_admin`, `get_current_admin`). Roles are encoded in signed JWT tokens, and user accounts are validated against the database on each request.
</details>

<details>
<summary><strong>3. Can a citizen elevate their role through the registration API?</strong></summary>
No. The registration schema ignores any client-supplied role and strictly assigns `UserRole.CITIZEN`. Role modification endpoints are restricted to verified `ADMIN` users only.
</details>

<details>
<summary><strong>4. How does the AI issue classification work?</strong></summary>
Text is normalized and vectorized using unigram and bigram TF-IDF with sublinear term scaling, followed by a multinomial Logistic Regression classifier trained on representative civic complaints across 8 categories.
</details>

<details>
<summary><strong>5. What happens if the AI classification model fails or is offline?</strong></summary>
The system gracefully falls back to a deterministic keyword-matching classifier. It never blocks report submission and marks the classification method as `rule_based_fallback`.
</details>

<details>
<summary><strong>6. How is duplicate report detection computed?</strong></summary>
A multi-signal composite score combines geodesic Haversine distance (pruning beyond 150m), Jaccard token overlap + TF-IDF cosine similarity on the descriptions, and category compatibility. Matches above 0.70 are flagged for staff review.
</details>

<details>
<summary><strong>7. Why not just merge reports automatically when duplicates are found?</strong></summary>
Automatic merging is high-risk in civic management. Two different problems (e.g. a pothole and a broken streetlight) can occur 10 meters apart. Suspected duplicates are linked for staff review rather than merged destructively.
</details>

<details>
<summary><strong>8. How is priority calculated?</strong></summary>
A transparent weighted formula evaluates public safety risk (35%), infrastructure severity (25%), time unresolved (20%), accessibility impacts (10%), and duplicate report volume (10%).
</details>

<details>
<summary><strong>9. How do you prevent civic complaints from delaying life-threatening emergencies?</strong></summary>
The priority scoring engine inspects text for extreme life hazards (e.g. live sparking wires, gas leaks) and triggers a prominent red emergency advisory notice directing citizens to contact emergency dispatch (112/911) immediately.
</details>

<details>
<summary><strong>10. How does the application protect citizen privacy on public feeds?</strong></summary>
Geographic coordinates on public listings are coarsened to 3 decimal places (~110 meters), and reporter names/emails are stripped from public responses.
</details>

<details>
<summary><strong>11. How do you secure image uploads against malware and tracking?</strong></summary>
Pillow verifies image integrity and magic bytes, discarding client MIME claims. Public derivatives are re-encoded into clean buffers, completely stripping EXIF and GPS tracking metadata, and saved with randomized UUID filenames.
</details>

<details>
<summary><strong>12. What algorithm is used for spatial distance calculations?</strong></summary>
The great-circle Haversine formula implemented in pure Python with unit tests, providing accurate distance measurements without requiring heavy GIS extensions during local development.
</details>

<details>
<summary><strong>13. How does the "Package-Tracking" status journey work?</strong></summary>
Modeled after shipping delivery steppers, it represents linear progression (Submitted &rarr; Reviewed &rarr; Assigned &rarr; In Progress &rarr; Resolved). Completed stages are highlighted, and the active stage features a gentle pulse animation.
</details>

<details>
<summary><strong>14. Can citizens mark their own complaints as resolved?</strong></summary>
No. The state machine strictly prohibits citizens from transitioning complaints to `RESOLVED` or `REJECTED`. Only authorized municipal staff can record resolution evidence and close complaints.
</details>

<details>
<summary><strong>15. What happens if a municipal worker falsely marks an issue resolved?</strong></summary>
Citizens can use the "Flag as Unresolved" button to reopen the report with mandatory explanatory feedback, resetting the status to `REOPENED` and alerting supervisory staff.
</details>

<details>
<summary><strong>16. How is rate limiting implemented?</strong></summary>
An in-memory sliding-window rate limiter tracks requests per client IP and endpoint, throttling brute force login attempts (15 req/min) and AI evaluation abuse (30 req/min).
</details>

<details>
<summary><strong>17. What password hashing standard is employed?</strong></summary>
`bcrypt` with 12 salting rounds, ensuring resistance to dictionary attacks and GPU-accelerated cracking.
</details>

<details>
<summary><strong>18. How are geospatial hotspots detected?</strong></summary>
A grid-based spatial aggregation algorithm buckets coordinates into geographic cells (approx 500m), computing centroid coordinates, report frequencies, and average severity scores.
</details>

<details>
<summary><strong>19. Why use Tailwind CSS with explicit design tokens?</strong></summary>
The "Daylight Civic" design system enforces a clean, bright aesthetic tailored for outdoor sunlight readability with WCAG 2.1 AA contrast compliance, avoiding arbitrary hardcoded colors.
</details>

<details>
<summary><strong>20. How is client-side state synchronized with the interactive map?</strong></summary>
Selecting a report pin in Leaflet pans the viewport and opens a popup summary, while selecting an item in the side panel centers the corresponding map marker.
</details>

<details>
<summary><strong>21. What happens during backend cold starts?</strong></summary>
The centralized frontend client catches network errors and HTTP 503 states, presenting friendly retry buttons and calm advisory banners without crashing or infinite spinners.
</details>

<details>
<summary><strong>22. Are audit logs protected from tampering?</strong></summary>
Audit logs are append-only. No API endpoint exists to update or delete audit events, preserving an indelible history of user registrations, role changes, and status transitions.
</details>

<details>
<summary><strong>23. How are database migrations managed?</strong></summary>
Alembic is configured alongside SQLAlchemy 2.0 models, enabling reproducible schema migrations across development SQLite and production PostgreSQL environments.
</details>

<details>
<summary><strong>24. What are the key limitations of the current system?</strong></summary>
The classification model is a statistical baseline trained on sample datasets; production deployment would benefit from continuous active learning. Image similarity is not yet factored into duplicate detection.
</details>

<details>
<summary><strong>25. What is the future technical roadmap?</strong></summary>
Offline-first PWA queueing, multilingual localization (Tamil & English), integration of satellite imagery, and automated contractor SLA escalation workflows.
</details>

---

## 9. License & Attribution
CIVIC PULSE is released under the MIT License for educational and municipal demonstration purposes.  
Map data &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
