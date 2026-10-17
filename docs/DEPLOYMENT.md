# CIVIC PULSE: Production Deployment Guide

## 1. Deployment Architecture

```text
Citizen Browser ---> Vercel / Netlify (Vite React Client)
                            | (HTTPS API Calls)
                            v
                      Render / Railway (FastAPI Python Service)
                            | (SQLAlchemy / asyncpg)
                            v
                      Managed PostgreSQL (Neon / Supabase / AWS RDS)
```

---

## 2. Backend Deployment (e.g. Render / Docker)

### 2.1 Start Command
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
```

### 2.2 Dockerfile
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run train script to compile model bundle
RUN python -m app.ai.train

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 3. Frontend Deployment (e.g. Vercel / Netlify)

### 3.1 Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.2 Single-Page Application (SPA) Routing Configuration
For Vercel (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Production Environment Variables Checklist

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Disables debug traces |
| `DEBUG` | `False` | Protects against error leak |
| `DATABASE_URL` | `postgresql+psycopg2://...` | Managed PostgreSQL connection string |
| `SECRET_KEY` | *(64-char random hex)* | Cryptographic JWT signing key |
| `FRONTEND_ORIGINS` | `https://civicpulse.yourdomain.com` | Strict CORS allowlist |
| `UPLOAD_STORAGE_BACKEND` | `local` or `s3` | Storage adapter |
| `MAX_UPLOAD_SIZE_MB` | `5` | Maximum photo upload limit |
| `AI_CONFIDENCE_THRESHOLD` | `0.65` | Human review threshold |
| `DUPLICATE_DISTANCE_METERS`| `150` | Geodesic radius for deduplication |

---

## 5. Post-Deployment Verification Steps
1. Navigate to `/api/v1/health` and verify HTTP 200 `{"status": "healthy"}`.
2. Navigate to `/api/v1/ready` and verify database connectivity.
3. Open the web application and register a new test citizen account.
4. Submit a report with a photograph; verify report persists after refreshing.
5. Log in with the staff demo account; verify the report appears in the triage queue.
6. Transition status to `IN_PROGRESS` and then `RESOLVED` with a resolution comment.
7. Confirm that the reporting citizen receives an in-app notification.
8. Inspect the browser console to confirm zero CORS errors and zero secret leaks.
