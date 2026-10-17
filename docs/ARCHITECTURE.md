# CIVIC PULSE: System Architecture

## 1. High-Level Architecture Overview

CIVIC PULSE is designed as a service-oriented modular monolith optimized for performance, explainability, maintainability, and clean role-based boundaries.

```mermaid
flowchart TD
    subgraph Citizens["Citizens & Public"]
        C1["Citizen Mobile / Desktop Browser"]
    end

    subgraph Staff["Municipal Operations"]
        S1["Field Staff & Department Inspectors"]
        A1["City Administrator"]
    end

    subgraph Frontend["React 18 + TypeScript Client"]
        F1["Daylight Civic UI (Tailwind CSS)"]
        F2["Report in 60s Wizard"]
        F3["Leaflet + OpenStreetMap Explorer"]
        F4["Package-Tracking Journey Stepper"]
        F5["Centralized API Client (JWT)"]
    end

    subgraph Backend["FastAPI REST Service (Python 3.12)"]
        B1["Security & RBAC Enforcement"]
        B2["Report Engine & Workflow State Machine"]
        B3["EXIF-Sanitized Image Storage Adapter"]
        B4["Geospatial Engine (Haversine & Grid Clustering)"]
        B5["AI Classification (TF-IDF + Deterministic Fallback)"]
        B6["AI Deduplication Engine (Hybrid Distance & Text)"]
        B7["Explainable Multi-factor Priority Scoring"]
        B8["In-App Notifications & Audit Logger"]
    end

    subgraph Storage["Persistence Layer"]
        DB[("PostgreSQL / SQLite Database")]
        IMG["Sanitized Image Store (Local / S3)"]
    end

    C1 --> F1
    S1 --> F1
    A1 --> F1
    F1 --> F5
    F5 -->|HTTPS / REST / JSON| B1
    B1 --> B2 & B4 & B5 & B6 & B7
    B2 --> DB & IMG
    B4 --> DB
    B8 --> DB
```

---

## 2. Component Design

### 2.1 Frontend Client
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: "Daylight Civic" design system via Tailwind CSS with WCAG 2.1 AA compliant color tokens.
- **Mapping**: Leaflet and React-Leaflet with OpenStreetMap tile layer and custom SVG status markers.
- **Visualizations**: Recharts for transparent, direct-labeled operational KPIs.
- **State Management**: Context-based authentication state (`AuthContext`) with automatic token injection and unauthorized request interception.

### 2.2 Backend Service
- **Framework**: FastAPI with Pydantic v2 validation.
- **ORM**: SQLAlchemy 2.0 with transactional atomic commits.
- **Security**: Passwords hashed with `bcrypt` (12 rounds); access tokens signed with `PyJWT` (HS256).
- **Rate Limiting**: Sliding-window in-memory rate limiter per IP/client.
- **Image Security**: Pillow image integrity verification, re-encoding to strip EXIF and GPS tracking metadata, randomized UUID filenames.

---

## 3. Workflow State Transition Engine

Every status transition is governed by a strict state-transition matrix enforced server-side.

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Citizen submits report
    SUBMITTED --> UNDER_REVIEW : Staff begins triage
    SUBMITTED --> REJECTED : Out of jurisdiction / duplicate
    SUBMITTED --> ASSIGNED : Directly dispatched
    
    UNDER_REVIEW --> ASSIGNED : Field unit allocated
    UNDER_REVIEW --> NEEDS_INFORMATION : Staff requests details
    UNDER_REVIEW --> REJECTED : Formal decline with reason
    UNDER_REVIEW --> IN_PROGRESS : Immediate repair commenced
    
    NEEDS_INFORMATION --> UNDER_REVIEW : Citizen submits clarification
    NEEDS_INFORMATION --> REJECTED : Abandoned report
    
    ASSIGNED --> IN_PROGRESS : Crew active on-site
    ASSIGNED --> UNDER_REVIEW : Re-evaluating allocation
    
    IN_PROGRESS --> RESOLVED : Repair completed (mandatory note)
    IN_PROGRESS --> NEEDS_INFORMATION : Blocker encountered
    
    RESOLVED --> CLOSED : Inspection verified
    RESOLVED --> REOPENED : Citizen flags unresolved
    
    CLOSED --> REOPENED : New failure flagged
    
    REOPENED --> UNDER_REVIEW : Re-evaluation
    REOPENED --> IN_PROGRESS : Expedited repair
```

---

## 4. Entity-Relationship Data Model

```mermaid
erDiagram
    USERS ||--o{ REPORTS : "submits"
    USERS ||--o{ ASSIGNMENTS : "assigned to/by"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "acts"
    CATEGORIES ||--o{ REPORTS : "classifies"
    REPORTS ||--o{ REPORT_IMAGES : "contains"
    REPORTS ||--o{ REPORT_HISTORY : "tracks"
    REPORTS ||--o{ ASSIGNMENTS : "allocated in"
    REPORTS ||--o{ DUPLICATE_RELATIONSHIPS : "primary/duplicate"

    USERS {
        string id PK
        string name
        string email UK
        string password_hash
        enum role "citizen | staff | admin"
        enum account_status "active | suspended"
        datetime created_at
    }

    CATEGORIES {
        int id PK
        string name UK
        string description
        string icon_name
        string color_hint
        boolean is_active
    }

    REPORTS {
        string id PK
        string public_reference UK
        string title
        string description
        int category_id FK
        string reported_by FK
        float latitude
        float longitude
        string location_description
        string ward_or_area
        enum status
        float priority_score
        enum priority_level "LOW | MEDIUM | HIGH | CRITICAL"
        string priority_explanation
        string ai_suggested_category
        float ai_confidence
        string assigned_to FK
        datetime created_at
        datetime updated_at
        datetime resolved_at
    }

    REPORT_IMAGES {
        string id PK
        string report_id FK
        string storage_key
        string original_filename
        string content_type
        int file_size
        boolean is_public
        boolean is_resolution_evidence
        datetime created_at
    }

    REPORT_HISTORY {
        int id PK
        string report_id FK
        string changed_by FK
        enum previous_status
        enum new_status
        string public_comment
        string internal_note
        datetime created_at
    }
```
