import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Category
from app.ai.classifier import SUPPORTED_CATEGORIES

# Import all API routers
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.reports import router as reports_router
from app.api.v1.ai import router as ai_router
from app.api.v1.staff import router as staff_router
from app.api.v1.admin import router as admin_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.notifications import router as notifications_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civic_pulse")


def init_default_categories():
    """Initializes standard civic issue categories if database is fresh."""
    db = SessionLocal()
    try:
        count = db.query(Category).count()
        if count == 0:
            category_defaults = [
                ("Potholes and damaged roads", "Road craters, broken tarmac, loose asphalt, and damaged street surfaces", "AlertTriangle", "#D98E04"),
                ("Garbage and waste management", "Overflowing public bins, illegal garbage dumping, and litter", "Trash2", "#0E7C86"),
                ("Drainage and sewage", "Clogged stormwater drains, overflowing sewage, and open manholes", "Droplets", "#2F6FDE"),
                ("Water supply and leakage", "Burst municipal water pipelines, leaking valves, and low pressure", "Droplet", "#0E7C86"),
                ("Broken streetlights", "Non-functional street lamps, dark streets, and flickering lights", "Lightbulb", "#F5A524"),
                ("Damaged public infrastructure", "Broken public benches, damaged foot overbridges, and bus shelters", "Building2", "#7B8794"),
                ("Public sanitation", "Dirty municipal toilets, unhygienic conditions, and stench", "ShieldAlert", "#2E8B57"),
                ("Other civic issues", "Miscellaneous public nuisances, fallen branches, and obstructions", "HelpCircle", "#52606D")
            ]
            for name, desc, icon, color in category_defaults:
                db.add(Category(
                    name=name,
                    description=desc,
                    icon_name=icon,
                    color_hint=color,
                    is_active=True
                ))
            db.commit()
            logger.info("Initialized default civic categories.")
    except Exception as e:
        logger.error(f"Error initializing categories: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables exist and seed categories
    Base.metadata.create_all(bind=engine)
    init_default_categories()
    logger.info("CIVIC PULSE backend started successfully.")
    yield
    logger.info("CIVIC PULSE backend shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "CIVIC PULSE: AI-Powered Civic Issue Reporting, Intelligence, "
        "Prioritization & Resolution Platform."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    simplified_errors = []
    for err in errors:
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        simplified_errors.append(f"{loc}: {err.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": simplified_errors}
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled system error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )


# Register all API v1 endpoints
api_prefix = settings.API_V1_STR
app.include_router(health_router, prefix=api_prefix)
app.include_router(auth_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(staff_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)


@app.get("/")
def root():
    return {
        "message": "Welcome to CIVIC PULSE API",
        "documentation": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
