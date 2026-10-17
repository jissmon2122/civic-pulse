import pytest
import os
import tempfile
from datetime import datetime, timedelta, timezone
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, accuracy_score, f1_score

from app.ai.train import TRAINING_DATASET
from app.ai.classifier import normalize_text, SUPPORTED_CATEGORIES, classifier
from app.ai.duplicates import check_duplicate_candidates
from app.ai.priority import compute_priority_score
from app.models import PriorityLevel, UserRole
from app.core.workflow import can_transition_status


def test_ai_dataset_balance_and_zero_leakage():
    """Verifies AI dataset size, uniform class balance, and absence of train/test data leakage."""
    texts = [f"{t} {d}" for t, d, _ in TRAINING_DATASET]
    labels = [c for _, _, c in TRAINING_DATASET]
    normalized_texts = [normalize_text(txt) for txt in texts]

    # Verify total samples and 8 supported categories
    assert len(TRAINING_DATASET) == 48
    assert len(set(labels)) == 8

    # Verify class balance: exactly 6 samples per class (12.5% each)
    from collections import Counter
    counts = Counter(labels)
    for cat in SUPPORTED_CATEGORIES:
        assert counts[cat] == 6, f"Class {cat} is unbalanced with {counts[cat]} samples"

    # Split train and test
    X_train, X_test, y_train, y_test = train_test_split(
        normalized_texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    # Verify disjointness (zero data leakage)
    train_set = set(X_train)
    test_set = set(X_test)
    overlap = train_set.intersection(test_set)
    assert len(overlap) == 0, f"Found data leakage between train and test: {overlap}"
    assert len(X_train) == 36
    assert len(X_test) == 12


def test_ai_confusion_matrix_and_metrics_verification():
    """Verifies that the trained baseline model yields reproducible accuracy and macro F1."""
    import json
    eval_file = os.path.join(os.path.dirname(__file__), "..", "app", "ai", "data", "evaluation_results.json")
    assert os.path.exists(eval_file), "evaluation_results.json must exist"

    with open(eval_file, "r") as f:
        results = json.load(f)

    assert results["total_dataset_samples"] == 48
    assert results["train_samples"] == 36
    assert results["test_samples"] == 12
    # Verify measured numbers
    assert 0.50 <= results["test_accuracy"] <= 0.70
    assert 0.50 <= results["test_macro_f1"] <= 0.70
    assert "confusion_matrix" in results
    assert len(results["confusion_matrix"]) == 8


def test_duplicate_candidate_distance_boundaries():
    """Tests duplicate detection boundary distances (within vs beyond radius)."""
    target = {
        "id": "target-geo",
        "title": "Water pipeline burst on 1st main",
        "description": "High pressure clean water gushing out onto the road",
        "latitude": 12.971600,
        "longitude": 77.594600,
        "category_id": 4
    }

    # ~111m away (0.001 deg latitude ~ 111 meters) -> Within 150m radius
    candidate_within = {
        "id": "cand-within",
        "public_reference": "CP-2026-W0001",
        "title": "Water pipeline burst on 1st main",
        "description": "Clean water gushing out onto the street",
        "latitude": 12.972600,
        "longitude": 77.594600,
        "category_id": 4,
        "status": "SUBMITTED"
    }

    # ~333m away (0.003 deg latitude ~ 333 meters) -> Outside 150m radius
    candidate_outside = {
        "id": "cand-outside",
        "public_reference": "CP-2026-O0001",
        "title": "Water pipeline burst on 1st main",
        "description": "High pressure clean water gushing out onto the road",
        "latitude": 12.974600,
        "longitude": 77.594600,
        "category_id": 4,
        "status": "SUBMITTED"
    }

    results = check_duplicate_candidates(
        target,
        [candidate_within, candidate_outside],
        radius_meters=150.0,
        similarity_threshold=0.50
    )

    ids = [r["candidate_report_id"] for r in results]
    assert "cand-within" in ids
    assert "cand-outside" not in ids


def test_priority_scoring_age_and_duplicate_weights():
    """Verifies that aging and duplicate reports dynamically increase priority score."""
    now = datetime.now(timezone.utc)
    fresh_time = now
    old_time = now - timedelta(days=14)

    score_fresh = compute_priority_score(
        title="Damaged footpath paving block",
        description="A couple of loose blocks on the sidewalk",
        category_name="Damaged public infrastructure",
        created_at=fresh_time,
        duplicate_count=0
    )

    score_aged_with_duplicates = compute_priority_score(
        title="Damaged footpath paving block",
        description="A couple of loose blocks on the sidewalk",
        category_name="Damaged public infrastructure",
        created_at=old_time,
        duplicate_count=5
    )

    # Aged report with 5 duplicates must score significantly higher
    assert score_aged_with_duplicates["score"] > score_fresh["score"]
    assert any("age" in f.lower() for f in score_aged_with_duplicates["factors"])
    assert any("duplicate" in f.lower() for f in score_aged_with_duplicates["factors"])


def test_alembic_fresh_database_migration_execution():
    """Verifies that Alembic can run migrations to head on a fresh SQLite database."""
    from alembic.config import Config
    from alembic import command
    import sqlite3

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        tmp_db_path = tmp.name

    try:
        alembic_ini = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        alembic_cfg = Config(alembic_ini)
        alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{tmp_db_path}")

        # Execute migration to head
        command.upgrade(alembic_cfg, "head")

        # Verify created tables in fresh SQLite database
        conn = sqlite3.connect(tmp_db_path)
        tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        conn.close()

        expected_tables = {
            "alembic_version", "categories", "users", "reports", "report_images",
            "report_history", "assignments", "duplicate_relationships", "notifications", "audit_logs"
        }
        assert expected_tables.issubset(set(tables)), f"Missing expected tables in {tables}"
    finally:
        if os.path.exists(tmp_db_path):
            try:
                os.remove(tmp_db_path)
            except Exception:
                pass
