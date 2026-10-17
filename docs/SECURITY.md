# CIVIC PULSE: Security & Threat Model

## 1. Authentication & Password Security
- **Hashing**: All user passwords are encrypted using `bcrypt` with work factor 12 rounds and automatic cryptographically secure salts.
- **Tokens**: Access tokens are signed using JSON Web Tokens (PyJWT) with `HS256` and a minimum 32-character secret key. Tokens expire within 24 hours.
- **No Client Elevation**: User registration strictly assigns the `CITIZEN` role. Role elevation endpoints are guarded by server-side `ADMIN` checks.

---

## 2. Server-Side Role-Based Access Control (RBAC)
Role permissions are evaluated on every protected route via FastAPI dependency injection:
- **Citizen**: Submit complaints, upload photos to own reports, view public reports, view own notifications, and flag own resolved complaints as unresolved.
- **Municipal Staff**: Access internal queue, assign field staff, update workflow statuses with public/internal notes, upload resolution evidence photos.
- **Administrator**: Promote/demote user roles (cannot demote self), create categories, query system audit logs.

*Boundary Tests*: Automated test suite verifies that citizens attempting to query `/api/v1/staff/*` or `/api/v1/admin/*` receive HTTP `403 Forbidden`.

---

## 3. Image Upload Security & Privacy
1. **Magic Bytes Validation**: File integrity and format are verified using Pillow `Image.open().verify()`. Extension or client MIME claims are never trusted blindly.
2. **Format Restriction**: Only `JPEG`, `PNG`, and `WEBP` formats are accepted.
3. **EXIF Stripping**: All images are re-encoded into clean memory buffers before persistence, stripping camera serial numbers, GPS tracking tags, and private metadata.
4. **Randomized File Storage**: Filenames are replaced with randomized UUID hex strings (`uuid.uuid4().hex`) to prevent path traversal and overwrite attacks.
5. **Size Boundaries**: Strict 5MB size limit enforced before reading entire files into memory.

---

## 4. Location Privacy Protection
- Public feeds display coordinates rounded to 3 decimal places (approx. 110 meters) via `anonymize_coordinates()`.
- Reporter email addresses and phone numbers are excluded from all public listings and OpenAPI schemas.

---

## 5. Rate Limiting & Abuse Defense
- An in-memory sliding-window rate limiter restricts requests per IP/endpoint:
  - Auth endpoints (`/auth/login`, `/auth/register`): 10-15 requests/minute.
  - Resource-intensive AI endpoints (`/ai/classify`, `/ai/duplicates/check`): 30 requests/minute.
  - General API endpoints: 60 requests/minute.

---

## 6. Audit Logging
Every privileged action (registration, login, status changes, assignments, role updates) records an entry in `audit_logs` capturing:
- `actor_id`
- `action`
- `entity_type` and `entity_id`
- Sanitized `metadata_json` (guaranteed free of passwords, tokens, or hashes).
