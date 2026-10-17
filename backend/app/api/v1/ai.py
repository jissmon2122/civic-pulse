import os
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Report, ReportStatus, Category
from app.schemas import (
    ClassifyRequest, ClassifyResponse,
    DuplicateCheckRequest, DuplicateCheckResponse, DuplicateMatchItem,
    PriorityExplainRequest, PriorityExplainResponse
)
from app.ai.classifier import classifier
from app.ai.duplicates import check_duplicate_candidates
from app.ai.priority import compute_priority_score
from app.core.rate_limit import rate_limit

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])


@router.post("/classify", response_model=ClassifyResponse, dependencies=[Depends(rate_limit(30, 60))])
def classify_issue(request: ClassifyRequest):
    """
    AI Feature 1: Classifies text into one of the 8 civic categories
    using statistical TF-IDF NLP model with deterministic fallback.
    """
    result = classifier.classify(request.title, request.description)
    return ClassifyResponse(**result)


@router.post("/duplicates/check", response_model=DuplicateCheckResponse, dependencies=[Depends(rate_limit(30, 60))])
def check_duplicates(request: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """
    AI Feature 2: Evaluates existing active reports within the geographic radius
    for potential duplicate complaints combining Haversine distance and TF-IDF text similarity.
    """
    active_reports = db.query(Report).filter(
        Report.status.in_([
            ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW,
            ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS
        ])
    ).all()

    candidates_input = [{
        "id": r.id,
        "public_reference": r.public_reference,
        "title": r.title,
        "description": r.description,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "category_id": r.category_id,
        "status": r.status.value
    } for r in active_reports]

    target_data = {
        "id": "query",
        "title": request.title,
        "description": request.description,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "category_id": request.category_id
    }

    matches = check_duplicate_candidates(
        target_report=target_data,
        existing_reports=candidates_input,
        radius_meters=request.radius_meters
    )

    items = [
        DuplicateMatchItem(
            candidate_report_id=m["candidate_report_id"],
            candidate_public_reference=m.get("candidate_public_reference"),
            candidate_title=m.get("candidate_title"),
            candidate_status=m.get("candidate_status"),
            distance_meters=m["distance_meters"],
            text_similarity=m["text_similarity"],
            composite_score=m["composite_score"],
            explanations=m["explanations"],
            recommended_action=m["recommended_action"]
        ) for m in matches
    ]

    return DuplicateCheckResponse(
        total_candidates_analyzed=len(candidates_input),
        duplicate_matches=items
    )


@router.post("/priority/explain", response_model=PriorityExplainResponse)
def explain_priority(request: PriorityExplainRequest):
    """
    AI Feature 3: Computes explainable multi-factor priority score with breakdown of factors
    and life-safety emergency escalation.
    """
    created_at = request.created_at or datetime.now(timezone.utc)
    result = compute_priority_score(
        title=request.title,
        description=request.description,
        category_name=request.category_name,
        created_at=created_at,
        duplicate_count=request.duplicate_count or 0
    )
    return PriorityExplainResponse(**result)


@router.get("/metrics")
def get_ai_evaluation_metrics():
    """Returns actual measured evaluation results on the held-out test dataset."""
    eval_path = os.path.join(os.path.dirname(__file__), "..", "..", "ai", "data", "evaluation_results.json")
    if os.path.exists(eval_path):
        with open(eval_path, "r") as f:
            return json.load(f)
    return {
        "model_version": classifier.model_version,
        "status": "baseline_active",
        "note": "Classifier model initialized with deterministic fallback."
    }
