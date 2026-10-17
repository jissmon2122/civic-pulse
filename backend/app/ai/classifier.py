import os
import re
import pickle
from typing import Dict, Any, Optional, Tuple, List
from app.config import settings

# Supported Categories matching the prompt specifications
SUPPORTED_CATEGORIES = [
    "Potholes and damaged roads",
    "Garbage and waste management",
    "Drainage and sewage",
    "Water supply and leakage",
    "Broken streetlights",
    "Damaged public infrastructure",
    "Public sanitation",
    "Other civic issues"
]

# Rule-based fallback keywords for transparent deterministic classification
KEYWORD_MAPPINGS = {
    "Potholes and damaged roads": [
        "pothole", "crater", "road", "asphalt", "tar", "tarmac", "speedbreaker", "uneven road", "cavity", "cracked street"
    ],
    "Garbage and waste management": [
        "garbage", "trash", "waste", "dump", "debris", "litter", "rubbish", "bin", "overflowing bin", "plastic", "refuse"
    ],
    "Drainage and sewage": [
        "drain", "drainage", "sewage", "sewer", "manhole", "gutter", "clogged drain", "overflowing drain", "stagnant water", "foul smell"
    ],
    "Water supply and leakage": [
        "water leak", "pipeline", "pipe burst", "drinking water", "supply line", "no water", "tap", "valve leaking", "hydrant"
    ],
    "Broken streetlights": [
        "streetlight", "street light", "lamp", "pole", "dark street", "light bulb", "flickering light", "no illumination", "wiring"
    ],
    "Damaged public infrastructure": [
        "bench", "pavement", "footpath", "sidewalk", "divider", "guard rail", "bus stop", "shelter", "railing", "bridge crack"
    ],
    "Public sanitation": [
        "public toilet", "urinal", "restroom", "sanitation", "unhygienic", "defecation", "stench", "washroom", "cleanliness"
    ]
}


def normalize_text(text: str) -> str:
    """Safely normalizes input text for processing."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def rule_based_fallback_classifier(text: str) -> Tuple[str, float, str]:
    """
    Deterministic rule-based classification fallback.
    Returns: (category, confidence, explanation)
    """
    norm = normalize_text(text)
    scores = {}
    
    for category, keywords in KEYWORD_MAPPINGS.items():
        matched = [k for k in keywords if k in norm]
        if matched:
            scores[category] = len(matched)
            
    if not scores:
        return "Other civic issues", 0.40, "No distinct category keywords identified; defaulted to Other civic issues."
        
    best_cat = max(scores, key=scores.get)
    matches_count = scores[best_cat]
    conf = min(0.50 + (matches_count * 0.12), 0.85)
    return best_cat, conf, f"Rule-based match based on detected civic keywords: {matches_count} matching term(s)."


class IssueClassifier:
    """Civic Issue Classifier supporting TF-IDF ML model with deterministic fallback."""
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.model_version = "v1.0.0-tfidf-baseline"
        self._load_model()

    def _load_model(self):
        model_path = os.path.join(os.path.dirname(__file__), "data", "classifier_model.pkl")
        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    bundle = pickle.load(f)
                    self.model = bundle["model"]
                    self.vectorizer = bundle["vectorizer"]
                    self.model_version = bundle.get("version", self.model_version)
            except Exception:
                self.model = None
                self.vectorizer = None

    def classify(self, title: str, description: str) -> Dict[str, Any]:
        combined_text = f"{title} {description}"
        norm = normalize_text(combined_text)

        # If trained ML model is available
        if self.model is not None and self.vectorizer is not None and len(norm) > 5:
            try:
                vec = self.vectorizer.transform([norm])
                probs = self.model.predict_proba(vec)[0]
                classes = self.model.classes_
                
                max_idx = probs.argmax()
                predicted_category = classes[max_idx]
                confidence = float(probs[max_idx])

                needs_review = confidence < settings.AI_CONFIDENCE_THRESHOLD

                return {
                    "suggested_category": predicted_category,
                    "confidence": round(confidence, 3),
                    "model_version": self.model_version,
                    "method": "machine_learning",
                    "needs_human_review": needs_review,
                    "explanation": f"Statistical text classification with {round(confidence * 100, 1)}% probability confidence."
                }
            except Exception:
                pass

        # Fallback to deterministic rule-based classifier
        cat, conf, expl = rule_based_fallback_classifier(combined_text)
        needs_review = conf < settings.AI_CONFIDENCE_THRESHOLD
        
        return {
            "suggested_category": cat,
            "confidence": round(conf, 3),
            "model_version": "v1.0.0-rule-fallback",
            "method": "rule_based_fallback",
            "needs_human_review": needs_review,
            "explanation": expl
        }


classifier = IssueClassifier()
