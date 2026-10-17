from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import statistics

from app.database import get_db
from app.models import Report, ReportStatus, PriorityLevel, Category
from app.schemas import (
    OverviewAnalytics, CategoryCount, StatusCount, AreaCount
)
from app.services.geo import compute_geospatial_hotspots

router = APIRouter(prefix="/analytics", tags=["Geospatial & Operational Analytics"])


@router.get("/overview", response_model=OverviewAnalytics)
def get_overview_analytics(db: Session = Depends(get_db)):
    """Computes high-level resolution and operational health statistics from real database records."""
    total = db.query(Report).count()
    if total == 0:
        return OverviewAnalytics(
            total_reports=0,
            open_reports=0,
            in_progress_reports=0,
            resolved_reports=0,
            resolution_rate_percent=0.0,
            avg_resolution_hours=None,
            median_resolution_hours=None,
            critical_overdue_count=0
        )

    open_count = db.query(Report).filter(
        Report.status.in_([ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW, ReportStatus.ASSIGNED, ReportStatus.REOPENED])
    ).count()

    in_prog = db.query(Report).filter(Report.status == ReportStatus.IN_PROGRESS).count()

    resolved_count = db.query(Report).filter(
        Report.status.in_([ReportStatus.RESOLVED, ReportStatus.CLOSED])
    ).count()

    resolution_rate = round((resolved_count / total) * 100.0, 1)

    # Resolution duration calculations
    resolved_reports = db.query(Report).filter(
        Report.resolved_at.isnot(None),
        Report.status.in_([ReportStatus.RESOLVED, ReportStatus.CLOSED])
    ).all()

    durations_hours = []
    for r in resolved_reports:
        if r.resolved_at and r.created_at:
            delta = (r.resolved_at - r.created_at).total_seconds() / 3600.0
            if delta >= 0:
                durations_hours.append(delta)

    avg_hours = round(statistics.mean(durations_hours), 1) if durations_hours else None
    median_hours = round(statistics.median(durations_hours), 1) if durations_hours else None

    # Critical overdue count (Critical priority and unresolved for > 24 hours)
    now = datetime.now(timezone.utc)
    critical_unresolved = db.query(Report).filter(
        Report.priority_level == PriorityLevel.CRITICAL,
        Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.CLOSED, ReportStatus.REJECTED])
    ).all()

    critical_overdue = 0
    for cr in critical_unresolved:
        cr_created = cr.created_at
        if cr_created.tzinfo is None:
            cr_created = cr_created.replace(tzinfo=timezone.utc)
        if (now - cr_created).total_seconds() > 86400:  # > 24 hrs
            critical_overdue += 1

    return OverviewAnalytics(
        total_reports=total,
        open_reports=open_count,
        in_progress_reports=in_prog,
        resolved_reports=resolved_count,
        resolution_rate_percent=resolution_rate,
        avg_resolution_hours=avg_hours,
        median_resolution_hours=median_hours,
        critical_overdue_count=critical_overdue
    )


@router.get("/categories", response_model=List[CategoryCount])
def get_category_analytics(db: Session = Depends(get_db)):
    """Computes breakdown of complaints across civic categories."""
    total = db.query(Report).count()
    if total == 0:
        return []

    cats = db.query(Category).all()
    results = []
    for cat in cats:
        count = db.query(Report).filter(Report.category_id == cat.id).count()
        results.append(CategoryCount(
            category_id=cat.id,
            category_name=cat.name,
            count=count,
            percentage=round((count / total) * 100.0, 1)
        ))
    results.sort(key=lambda x: x.count, reverse=True)
    return results


@router.get("/status", response_model=List[StatusCount])
def get_status_distribution(db: Session = Depends(get_db)):
    """Returns distribution of complaints across all workflow statuses."""
    results = []
    for st in ReportStatus:
        cnt = db.query(Report).filter(Report.status == st).count()
        results.append(StatusCount(status=st.value, count=cnt))
    return results


@router.get("/areas", response_model=List[AreaCount])
def get_area_analytics(db: Session = Depends(get_db)):
    """Aggregates reports and resolution rates per municipal ward or neighborhood."""
    raw_areas = db.query(Report.ward_or_area, func.count(Report.id)).group_by(Report.ward_or_area).all()
    
    results = []
    for area_name, count in raw_areas:
        display_name = area_name if area_name else "Unassigned Ward"
        resolved_count = db.query(Report).filter(
            Report.ward_or_area == area_name,
            Report.status.in_([ReportStatus.RESOLVED, ReportStatus.CLOSED])
        ).count()
        results.append(AreaCount(
            ward_or_area=display_name,
            count=count,
            resolved_count=resolved_count
        ))
    results.sort(key=lambda x: x.count, reverse=True)
    return results


@router.get("/hotspots")
def get_geospatial_hotspots(db: Session = Depends(get_db)):
    """Computes geospatial density clusters to detect geographic problem hotspots."""
    reports = db.query(Report).all()
    report_data = [{
        "id": r.id,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "priority_score": r.priority_score
    } for r in reports]

    hotspots = compute_geospatial_hotspots(report_data, grid_size_degrees=0.005)
    return {
        "total_hotspots": len(hotspots),
        "hotspots": hotspots
    }
