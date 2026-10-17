from typing import List, Dict, Any, Optional
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.geo import haversine_distance_meters
from app.ai.classifier import normalize_text
from app.config import settings


def compute_text_similarity(text1: str, text2: str) -> float:
    """
    Computes text similarity between two civic reports.
    Combines Jaccard token overlap with TF-IDF cosine similarity
    for robust comparison on short civic complaint phrases.
    """
    t1 = normalize_text(text1)
    t2 = normalize_text(text2)
    if not t1 or not t2:
        return 0.0

    if t1 == t2:
        return 1.0

    tokens1 = set(t1.split())
    tokens2 = set(t2.split())
    if not tokens1 or not tokens2:
        return 0.0

    # Jaccard overlap on informative tokens
    intersection = tokens1 & tokens2
    union = tokens1 | tokens2
    jaccard_sim = len(intersection) / len(union) if union else 0.0

    # TF-IDF cosine similarity
    tfidf_sim = 0.0
    try:
        vec = TfidfVectorizer(ngram_range=(1, 1))
        matrix = vec.fit_transform([t1, t2])
        tfidf_sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    except Exception:
        tfidf_sim = jaccard_sim

    # Composite similarity: 50% Jaccard + 50% TF-IDF
    combined_sim = round(0.50 * jaccard_sim + 0.50 * tfidf_sim, 3)
    return combined_sim


def check_duplicate_candidates(
    target_report: Dict[str, Any],
    existing_reports: List[Dict[str, Any]],
    radius_meters: Optional[float] = None,
    similarity_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Evaluates candidate existing reports to detect duplicates based on:
    1. Geodesic distance (Haversine).
    2. Category congruence.
    3. Text description similarity.
    """
    if radius_meters is None:
        radius_meters = settings.DUPLICATE_DISTANCE_METERS
    if similarity_threshold is None:
        similarity_threshold = settings.DUPLICATE_SIMILARITY_THRESHOLD

    target_lat = target_report["latitude"]
    target_lon = target_report["longitude"]
    target_cat = target_report.get("category_id")
    target_text = f"{target_report.get('title', '')} {target_report.get('description', '')}"

    candidates = []

    for report in existing_reports:
        # Skip self
        if report.get("id") == target_report.get("id"):
            continue

        if report.get("status") in {"RESOLVED", "CLOSED", "REJECTED"}:
            continue

        # 1. Geographic distance check
        distance = haversine_distance_meters(
            target_lat, target_lon,
            report["latitude"], report["longitude"]
        )

        if distance > radius_meters:
            continue

        # 2. Category compatibility
        same_category = (report.get("category_id") == target_cat)
        category_score = 1.0 if same_category else 0.2

        # 3. Text similarity
        other_text = f"{report.get('title', '')} {report.get('description', '')}"
        text_sim = compute_text_similarity(target_text, other_text)

        # Distance score: closer -> higher score (1.0 at 0m, decaying to 0.0 at radius_meters)
        distance_score = max(0.0, 1.0 - (distance / radius_meters))

        # Composite score
        composite_score = (
            (0.50 * text_sim) +
            (0.30 * distance_score) +
            (0.20 * category_score)
        )
        composite_score = round(composite_score, 3)

        if composite_score >= similarity_threshold:
            explanations = [
                f"Located within {round(distance, 1)} meters of this report",
                f"Text similarity measured at {round(text_sim * 100, 1)}%",
                "Matching civic category" if same_category else "Different category reported"
            ]

            candidates.append({
                "candidate_report_id": report["id"],
                "candidate_public_reference": report.get("public_reference"),
                "candidate_title": report.get("title"),
                "candidate_status": report.get("status"),
                "distance_meters": round(distance, 1),
                "text_similarity": text_sim,
                "composite_score": composite_score,
                "explanations": explanations,
                "recommended_action": "FLAG_FOR_STAFF_REVIEW"
            })

    candidates.sort(key=lambda x: x["composite_score"], reverse=True)
    return candidates
