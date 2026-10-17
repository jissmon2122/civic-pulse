# CIVIC PULSE: AI & Geospatial Methodology

## 1. Overview and Core Philosophy

CIVIC PULSE adopts an explainable, deterministic-first AI architecture. In public-sector civic technology, transparency is paramount: black-box deep learning models that produce uninterpretable numbers are unsuitable for municipal accountability. Our system pairs statistical natural language processing with strict rule-based fallbacks and transparent scoring formulas.

---

## 2. Feature 1: Issue Classification

### 2.1 Formulation
Given a citizen report with a text title $T$ and description $D$, predict the most probable civic category $C \in \mathcal{C}$ where:
$$|\mathcal{C}| = 8 \text{ standard municipal categories}$$

### 2.2 Text Normalization Pipeline
1. Case folding to lower case.
2. Punctuation stripping with regex `[^\w\s]`.
3. Whitespace normalization.
4. Tokenization.

### 2.3 Model Architecture
- **Feature Extraction**: `TfidfVectorizer(ngram_range=(1, 2), max_features=1000)` capturing both key individual words (e.g., "pothole", "sewage") and phrases (e.g., "live wire", "open manhole").
- **Classification Engine**: Multinomial `LogisticRegression(C=2.0, max_iter=200)` with calibrated probability estimates across all 8 classes.

### 2.4 Actual Measured Evaluation (Held-Out Test Set)
Evaluated on a stratified 25% held-out test split of representative civic complaints:
- **Test Accuracy**: `58.33%`
- **Macro F1 Score**: `0.5708`
- **Confidence Threshold**: Reports with confidence $< 0.65$ are explicitly flagged with `needs_human_review = True`.
- **Human Confirmation**: The AI suggestion is stored separately from the final human-confirmed category. Citizens and municipal staff can override the recommendation at any time.

### 2.5 Deterministic Rule-Based Fallback
If the ML model bundle is unreadable or during extreme cold starts, a keyword frequency mapping across the 8 categories acts as a resilient fallback, ensuring zero downtime.

---

## 3. Feature 2: Multi-Signal Duplicate Detection

### 3.1 Motivation
Unrelated issues in close proximity (e.g., a broken streetlight and a pothole 20 meters apart) must **never** be merged. Similarly, identical complaints on different streets are not duplicates. Detection must combine multiple orthogonal signals.

### 3.2 Detection Signals & Formula
For a target report $R_t$ and existing active report $R_e$:
1. **Geographic Proximity ($S_{geo}$)**:
   Haversine distance $d$ in meters:
   $$d = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   Reports with $d > 150\text{m}$ are immediately pruned.
   Within the radius:
   $$S_{geo} = \max\left(0.0, 1.0 - \frac{d}{150}\right)$$

2. **Text Description Similarity ($S_{text}$)**:
   A composite of Jaccard token overlap and TF-IDF cosine similarity:
   $$S_{text} = 0.50 \cdot J(T_1, T_2) + 0.50 \cdot \text{CosineSim}(\vec{v}_1, \vec{v}_2)$$

3. **Category Congruence ($S_{cat}$)**:
   $1.0$ if matching categories; $0.2$ otherwise.

4. **Composite Duplicate Score**:
   $$\text{Score}_{dup} = (0.50 \cdot S_{text}) + (0.30 \cdot S_{geo}) + (0.20 \cdot S_{cat})$$

If $\text{Score}_{dup} \ge 0.70$, the candidate is registered as a suspected duplicate and flagged for staff confirmation. Original reports and histories are always preserved.

---

## 4. Feature 3: Explainable Priority Scoring

### 4.1 Weighted Formula
Priority is calculated using a transparent weighted combination of 5 normalized factors:

$$\text{Score} = w_{safety} S_{safe} + w_{sev} S_{sev} + w_{age} S_{age} + w_{access} S_{access} + w_{dup} S_{dup}$$

Configured Weights:
- $w_{safety} = 0.35$ (Public safety hazard)
- $w_{sev} = 0.25$ (Infrastructure severity)
- $w_{age} = 0.20$ (Time unresolved / aging)
- $w_{access} = 0.10$ (Accessibility barrier / hospital / school zone)
- $w_{dup} = 0.10$ (Demand signal from duplicate reports)

### 4.2 Priority Levels
- **CRITICAL** ($\ge 80$ or immediate life danger detected)
- **HIGH** ($55 - 79$)
- **MEDIUM** ($30 - 54$)
- **LOW** ($< 30$)

### 4.3 Life-Safety Emergency Guidance
If keywords matching extreme danger ("live wire", "gas leak", "bridge collapse", "electrocution") are triggered, the platform immediately displays a prominent life-safety advisory:
> *"SAFETY NOTICE: For immediate life-safety emergencies, please contact emergency dispatch (112 / 911) immediately."*
Civic Pulse functions strictly as a decision-support system and never delays emergency services.
