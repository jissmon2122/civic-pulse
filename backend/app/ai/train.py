import os
import json
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score, confusion_matrix
from app.ai.classifier import normalize_text, SUPPORTED_CATEGORIES

# Labeled training dataset representing common civic complaints across categories
TRAINING_DATASET = [
    # Potholes and damaged roads
    ("Deep pothole near junction", "Large crater on the road causing traffic slowdown and damaging car tyres", "Potholes and damaged roads"),
    ("Asphalt washed away after rain", "The road surface has broken up and stones are flying onto pedestrians", "Potholes and damaged roads"),
    ("Uneven road surface and sunken patch", "The main street has sunken dips that cause two wheelers to skid", "Potholes and damaged roads"),
    ("Huge road crater near bus stop", "A deep pothole opened up on the left lane right where buses stop", "Potholes and damaged roads"),
    ("Cracked tarmac on bridge approach", "Multiple potholes and loose gravel on the bridge ramp", "Potholes and damaged roads"),
    ("Speedbreaker broken into rubble", "Damaged asphalt speed bump has sharp stones sticking out", "Potholes and damaged roads"),
    
    # Garbage and waste management
    ("Overflowing garbage bin at market", "Trash has spilled out onto the pedestrian pavement creating foul stench", "Garbage and waste management"),
    ("Illegal waste dumping on vacant plot", "Trucks dumping plastic debris and commercial waste every night", "Garbage and waste management"),
    ("Garbage truck has not collected waste for 4 days", "Household waste accumulating outside residential society gate", "Garbage and waste management"),
    ("Litter scattered all over public park", "Plastic bottles and food packaging dumped across the lawn and walking track", "Garbage and waste management"),
    ("Construction debris dumped on sidewalk", "Huge pile of concrete rubble and plaster bags blocking the footpath", "Garbage and waste management"),
    ("Rotting refuse attracting stray animals", "Unattended waste container near school gate causing health hazard", "Garbage and waste management"),

    # Drainage and sewage
    ("Clogged stormwater drain during rains", "Water cannot flow and is backing up onto the ground floor shops", "Drainage and sewage"),
    ("Sewage line overflowing onto road", "Manhole lid is bubbling up black sewer water with terrible odor", "Drainage and sewage"),
    ("Open manhole cover missing", "Dangerous deep sewer chamber left uncovered on the street without warning signs", "Drainage and sewage"),
    ("Gutter completely blocked with silt", "Roadside open gutter overflowing with dirty sludge after heavy shower", "Drainage and sewage"),
    ("Stagnant sewage water breeding mosquitoes", "Persistent puddle of contaminated water pool on the corner", "Drainage and sewage"),
    ("Underground sewer pipe collapsed", "Sinkhole formed around the broken sewer manhole in residential lane", "Drainage and sewage"),

    # Water supply and leakage
    ("Drinking water pipeline burst", "High pressure clean water gushing out onto the road wasting thousands of liters", "Water supply and leakage"),
    ("No water supply in sector 4 for 48 hours", "Low pipeline pressure and municipal water tap completely dry", "Water supply and leakage"),
    ("Main municipal valve leaking continuously", "Substantial water pool around the pipeline junction valve", "Water supply and leakage"),
    ("Muddy and contaminated tap water", "The drinking water supplied this morning is brown and smells like dirt", "Water supply and leakage"),
    ("Public drinking fountain pipe broken", "Water fountain running non stop into the street drain", "Water supply and leakage"),
    ("Underground leak causing wet road patch", "Water seeping up through road tiles even in dry weather", "Water supply and leakage"),

    # Broken streetlights
    ("Streetlights not working on entire stretch", "The whole 500m avenue is completely dark at night creating safety hazard", "Broken streetlights"),
    ("Flickering street lamp pole", "Streetlight blinking on and off repeatedly causing poor visibility for drivers", "Broken streetlights"),
    ("Light fixture fallen from electric pole", "The lamp head is dangling by wires over the road", "Broken streetlights"),
    ("Streetlights remaining on during day time", "Timer malfunction causing lights to burn in broad daylight wasting energy", "Broken streetlights"),
    ("Dark pathway in public garden", "Garden light poles have dead bulbs for past two weeks", "Broken streetlights"),
    ("Exposed wires at streetlight base", "Electrical cover missing at bottom of lamppost near children playground", "Broken streetlights"),

    # Damaged public infrastructure
    ("Broken concrete bench in park", "The seating slab has cracked in half and rebar is exposed", "Damaged public infrastructure"),
    ("Damaged pedestrian foot overbridge railing", "Safety guardrail is missing on the stairs leading to railway platform", "Damaged public infrastructure"),
    ("Bus stop shelter roof collapsed", "Corrugated sheet blew away in the storm leaving commuters exposed", "Damaged public infrastructure"),
    ("Broken sidewalk paving tiles", "Paver blocks missing or loose causing elderly pedestrians to trip", "Damaged public infrastructure"),
    ("Road divider barrier smashed", "Concrete central median broken into roadway by vehicle impact", "Damaged public infrastructure"),
    ("Playground swing set broken", "Chain snapped and support pole rusted loose at neighborhood park", "Damaged public infrastructure"),

    # Public sanitation
    ("Public toilet facility locked and dirty", "Municipal urinal facility without running water and extremely filthy", "Public sanitation"),
    ("Severe stench from unsanitized public lavatory", "Foul odor spreading to adjacent market due to lack of daily cleaning", "Public sanitation"),
    ("Broken doors in women public washroom", "Latches broken and hygiene is compromised in public convenience center", "Public sanitation"),
    ("Unsanitary conditions around community water tap", "Mud, spitting, and stagnant water around public drinking stand", "Public sanitation"),
    ("Public urinal overflowing without drainage", "Liquid waste running across walking path outside railway station", "Public sanitation"),
    ("Disinfection and sanitization needed at public bus terminal", "Litter and dirty restrooms creating severe sanitation problem", "Public sanitation"),

    # Other civic issues
    ("Dead tree branch hanging precariously", "Heavy dry branch about to fall onto parked vehicles and pedestrians", "Other civic issues"),
    ("Illegal commercial hoarding blocking traffic view", "Large metal billboard erected without permit blocking road sign", "Other civic issues"),
    ("Abandoned vehicle blocking lane", "Unattended car covered in dust parked for 6 months obstructing fire lane", "Other civic issues"),
    ("Stray cattle blocking main traffic junction", "Animals roaming in the middle of four way intersection", "Other civic issues"),
    ("Construction noise throughout midnight", "Commercial builder operating pile driver past permitted municipal hours", "Other civic issues"),
    ("Overgrown roadside bushes covering street name sign", "Unpruned shrubs obscuring intersection visibility", "Other civic issues")
]


def train_and_evaluate_classifier():
    texts = [f"{t} {d}" for t, d, _ in TRAINING_DATASET]
    labels = [c for _, _, c in TRAINING_DATASET]
    
    normalized_texts = [normalize_text(txt) for txt in texts]

    # Stratified split 80% train / 20% test
    X_train, X_test, y_train, y_test = train_test_split(
        normalized_texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1000)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    model = LogisticRegression(C=2.0, max_iter=200, random_state=42)
    model.fit(X_train_vec, y_train)

    y_pred = model.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    classes = sorted(list(set(labels)))
    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Save trained model bundle
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    model_bundle = {
        "model": model,
        "vectorizer": vectorizer,
        "version": "v1.0.0-tfidf-logreg",
        "supported_categories": SUPPORTED_CATEGORIES
    }
    with open(os.path.join(data_dir, "classifier_model.pkl"), "wb") as f:
        pickle.dump(model_bundle, f)

    # Save actual measured evaluation results
    eval_results = {
        "model_version": "v1.0.0-tfidf-logreg",
        "algorithm": "TfidfVectorizer (unigram + bigram) + LogisticRegression (C=2.0)",
        "total_dataset_samples": len(TRAINING_DATASET),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "test_accuracy": round(float(acc), 4),
        "test_macro_f1": round(float(macro_f1), 4),
        "class_labels": classes,
        "confusion_matrix": cm,
        "detailed_metrics": report
    }
    with open(os.path.join(data_dir, "evaluation_results.json"), "w") as f:
        json.dump(eval_results, f, indent=2)

    print(f"Model successfully trained. Test Accuracy: {acc:.4f}, Macro F1: {macro_f1:.4f}")
    return eval_results


if __name__ == "__main__":
    train_and_evaluate_classifier()
