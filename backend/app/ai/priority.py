from typing import Dict, Any, List
from datetime import datetime, timezone
from app.config import settings
from app.models import PriorityLevel
from app.ai.classifier import normalize_text


# High-hazard safety triggers
SAFETY_CRITICAL_KEYWORDS = {
    "live wire": 95,
    "exposed wire": 90,
    "sparking": 85,
    "electrocution": 100,
    "open manhole": 90,
    "sinkhole": 90,
    "gas leak": 100,
    "pipeline explosion": 100,
    "bridge collapse": 100,
    "wall collapse": 85,
    "deep crater": 75,
    "safety concern": 65,
    "hazard": 70,
    "danger": 70,
    "accident": 75,
    "traffic blind spot": 70
}

# Accessibility barrier keywords
ACCESSIBILITY_KEYWORDS = {
    "wheelchair": 80,
    "blind": 80,
    "elderly": 70,
    "sidewalk blocked": 75,
    "ramp broken": 80,
    "hospital": 85,
    "school": 85,
    "pedestrian crossing": 75
}

# Category baseline severity
CATEGORY_SEVERITY = {
    "Drainage and sewage": 65,
    "Water supply and leakage": 60,
    "Potholes and damaged roads": 55,
    "Broken streetlights": 50,
    "Damaged public infrastructure": 50,
    "Public sanitation": 55,
    "Garbage and waste management": 45,
    "Other civic issues": 40
}


def compute_priority_score(
    title: str,
    description: str,
    category_name: str,
    created_at: datetime,
    duplicate_count: int = 0
) -> Dict[str, Any]:
    """
    Computes an explainable, multi-factor priority score (0-100) with contributing factors.
    """
    combined = normalize_text(f"{title} {description}")
    factors: List[str] = []

    # 1. Safety Risk Assessment (0-100)
    safety_score = 20.0  # standard baseline
    is_emergency = False
    for kw, val in SAFETY_CRITICAL_KEYWORDS.items():
        if kw in combined:
            safety_score = max(safety_score, float(val))
            factors.append(f"Safety risk factor detected: '{kw}'")
            if val >= 90:
                is_emergency = True

    # 2. Infrastructure Severity (0-100)
    base_sev = float(CATEGORY_SEVERITY.get(category_name, 45))
    if any(w in combined for w in ["completely broken", "major", "severe", "huge", "burst", "massive", "deep"]):
        base_sev = min(100.0, base_sev + 25.0)
        factors.append("Severe infrastructure damage qualifiers reported")
    else:
        factors.append(f"Standard {category_name} infrastructure severity baseline")

    # 3. Time Unresolved (Age Factor) (0-100)
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age_hours = max(0.0, (now - created_at).total_seconds() / 3600.0)
    
    age_score = min(100.0, (age_hours / 72.0) * 100.0)
    if age_hours > 48:
        factors.append(f"Issue unresolved for {int(age_hours // 24)} days (age escalation)")

    # 4. Accessibility Impact (0-100)
    access_score = 20.0
    for ak, aval in ACCESSIBILITY_KEYWORDS.items():
        if ak in combined:
            access_score = max(access_score, float(aval))
            factors.append(f"Public accessibility impact: '{ak}' area")

    # 5. Duplicate Demand Signal (0-100)
    dup_score = min(100.0, duplicate_count * 25.0)
    if duplicate_count > 0:
        factors.append(f"Demand signal amplified by {duplicate_count} related duplicate citizen reports")

    # Weighted Sum Formula
    weighted_score = (
        (settings.PRIORITY_SAFETY_WEIGHT * safety_score) +
        (settings.PRIORITY_SEVERITY_WEIGHT * base_sev) +
        (settings.PRIORITY_AGE_WEIGHT * age_score) +
        (settings.PRIORITY_ACCESSIBILITY_WEIGHT * access_score) +
        (settings.PRIORITY_DUPLICATE_WEIGHT * dup_score)
    )

    final_score = round(min(100.0, max(5.0, weighted_score)), 1)

    # Determine Priority Level
    if is_emergency or final_score >= 80.0:
        level = PriorityLevel.CRITICAL
    elif final_score >= 55.0:
        level = PriorityLevel.HIGH
    elif final_score >= 30.0:
        level = PriorityLevel.MEDIUM
    else:
        level = PriorityLevel.LOW

    requires_review = (level in {PriorityLevel.HIGH, PriorityLevel.CRITICAL})

    # Emergency Guidance Notice if severe
    emergency_guidance = None
    if is_emergency or level == PriorityLevel.CRITICAL:
        emergency_guidance = (
            "SAFETY NOTICE: This report involves urgent public safety risk factors. "
            "Civic Pulse is a decision-support system. If there is immediate danger to life or property, "
            "please immediately contact local emergency services (112 / 911 / 100)."
        )

    return {
        "score": final_score,
        "priority_level": level,
        "factors": factors,
        "requires_human_review": requires_review,
        "is_emergency": is_emergency,
        "emergency_guidance": emergency_guidance
    }
