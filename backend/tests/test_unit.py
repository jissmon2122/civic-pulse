import pytest
from datetime import datetime, timedelta, timezone
from app.services.geo import haversine_distance_meters, anonymize_coordinates, compute_geospatial_hotspots
from app.ai.classifier import normalize_text, classifier, rule_based_fallback_classifier
from app.ai.priority import compute_priority_score
from app.ai.duplicates import compute_text_similarity, check_duplicate_candidates
from app.core.workflow import can_transition_status
from app.models import ReportStatus, UserRole, PriorityLevel


def test_haversine_distance():
    # Test identical coordinates return 0 distance
    dist_zero = haversine_distance_meters(12.9716, 77.5946, 12.9716, 77.5946)
    assert dist_zero == 0.0

    # Test short distance (~111 meters for 0.001 deg latitude difference)
    dist_short = haversine_distance_meters(12.9710, 77.5946, 12.9720, 77.5946)
    assert 100 < dist_short < 125


def test_anonymize_coordinates():
    lat, lon = anonymize_coordinates(12.9715678, 77.5946123, precision_decimals=3)
    assert lat == 12.972
    assert lon == 77.595


def test_geospatial_hotspots():
    reports = [
        {"id": "1", "latitude": 12.971, "longitude": 77.594, "priority_score": 50.0},
        {"id": "2", "latitude": 12.972, "longitude": 77.595, "priority_score": 70.0},
        {"id": "3", "latitude": 13.050, "longitude": 77.650, "priority_score": 30.0},
    ]
    hotspots = compute_geospatial_hotspots(reports, grid_size_degrees=0.01)
    assert len(hotspots) >= 1
    assert hotspots[0]["count"] >= 2


def test_text_normalization():
    raw = "  Dangerous Pothole, @Main Street!!!  "
    norm = normalize_text(raw)
    assert norm == "dangerous pothole main street"


def test_ai_classifier_fallback():
    cat, conf, expl = rule_based_fallback_classifier("Huge crater and pothole on asphalt road")
    assert cat == "Potholes and damaged roads"
    assert conf > 0.5

    cat2, conf2, expl2 = rule_based_fallback_classifier("Completely random gibberish xyz abc")
    assert cat2 == "Other civic issues"


def test_ai_classifier_predict():
    res = classifier.classify("Streetlight not working", "The road is completely dark and the lamp is broken")
    assert "suggested_category" in res
    assert res["suggested_category"] == "Broken streetlights"
    assert res["confidence"] > 0.0
    assert "needs_human_review" in res


def test_priority_scoring_emergency_escalation():
    # Emergency live wire test
    p_emergency = compute_priority_score(
        title="Live wire sparking on pedestrian path",
        description="High voltage cable fell down, sparking near children school",
        category_name="Broken streetlights",
        created_at=datetime.now(timezone.utc)
    )
    assert p_emergency["priority_level"] == PriorityLevel.CRITICAL
    assert p_emergency["is_emergency"] is True
    assert p_emergency["emergency_guidance"] is not None
    assert any("live wire" in f for f in p_emergency["factors"])

    # Routine issue test
    p_routine = compute_priority_score(
        title="Fallen leaf litter",
        description="A few dead leaves swept onto the corner of the sidewalk",
        category_name="Garbage and waste management",
        created_at=datetime.now(timezone.utc)
    )
    assert p_routine["priority_level"] in (PriorityLevel.LOW, PriorityLevel.MEDIUM)
    assert p_routine["is_emergency"] is False


def test_text_similarity():
    sim_partial = compute_text_similarity(
        "Deep pothole near central bus stop",
        "Large pothole crater right by bus stop"
    )
    assert sim_partial >= 0.30

    sim_high = compute_text_similarity(
        "Deep pothole near central bus stop",
        "Deep pothole near central bus stop road"
    )
    assert sim_high > 0.70

    sim_low = compute_text_similarity(
        "Water supply pipe burst in market",
        "Streetlight flickering on residential avenue"
    )
    assert sim_low < 0.20


def test_duplicate_candidates_detection():
    target = {
        "id": "target-1",
        "title": "Severe pothole on 4th cross",
        "description": "Deep crater in asphalt near hospital",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "category_id": 1
    }
    existing = [
        {
            "id": "cand-1",
            "public_reference": "CP-2026-00001",
            "title": "Severe pothole crater on 4th cross",
            "description": "Deep crater near hospital entrance",
            "latitude": 12.9717,  # ~11 meters away
            "longitude": 77.5946,
            "category_id": 1,
            "status": "SUBMITTED"
        },
        {
            "id": "cand-2",
            "public_reference": "CP-2026-00002",
            "title": "Broken streetlight pole",
            "description": "Streetlight not working on highway",
            "latitude": 12.9900,  # kilometers away
            "longitude": 77.6500,
            "category_id": 5,
            "status": "SUBMITTED"
        }
    ]
    candidates = check_duplicate_candidates(target, existing, radius_meters=150.0, similarity_threshold=0.50)
    assert len(candidates) == 1
    assert candidates[0]["candidate_report_id"] == "cand-1"
    assert candidates[0]["distance_meters"] < 20.0


def test_workflow_state_transitions():
    # Permitted staff transition: SUBMITTED -> UNDER_REVIEW
    ok, msg = can_transition_status(ReportStatus.SUBMITTED, ReportStatus.UNDER_REVIEW, UserRole.STAFF)
    assert ok is True

    # Permitted staff transition: IN_PROGRESS -> RESOLVED
    ok, msg = can_transition_status(ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED, UserRole.STAFF)
    assert ok is True

    # Forbidden: Citizen cannot officially resolve report
    ok, msg = can_transition_status(ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED, UserRole.CITIZEN, is_reporter=True)
    assert ok is False
    assert "permission" in msg.lower()

    # Forbidden: Invalid jump from SUBMITTED directly to RESOLVED without triage
    ok, msg = can_transition_status(ReportStatus.SUBMITTED, ReportStatus.RESOLVED, UserRole.STAFF)
    assert ok is False

    # Permitted citizen reopening: RESOLVED -> REOPENED on own report
    ok, msg = can_transition_status(ReportStatus.RESOLVED, ReportStatus.REOPENED, UserRole.CITIZEN, is_reporter=True)
    assert ok is True

    # Forbidden citizen reopening someone else's report
    ok, msg = can_transition_status(ReportStatus.RESOLVED, ReportStatus.REOPENED, UserRole.CITIZEN, is_reporter=False)
    assert ok is False
