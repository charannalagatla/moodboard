"""
MoodBoard — Flask ML Service
Emotion detection via HuggingFace transformers.

Model: j-hartmann/emotion-english-distilroberta-base
Returns 7 emotions: anger, disgust, fear, joy, neutral, sadness, surprise
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)
CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5000"))

# ── Load model once at startup ────────────────────────────────
print("Loading emotion model... (this may take a minute on first run)")
classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None,          # return all labels with scores
    device=-1,           # CPU; change to 0 for GPU
)
print("✅ Emotion model loaded.")

# ── Emotion label normalisations ──────────────────────────────
LABEL_MAP = {
    "anger":    "anger",
    "disgust":  "disgust",
    "fear":     "fear",
    "joy":      "joy",
    "neutral":  "neutral",
    "sadness":  "sadness",
    "surprise": "surprise",
}


def analyse_text(text: str) -> dict:
    """Run the classifier and return structured results."""
    raw = classifier(text[:512])[0]  # truncate to model max length

    emotions = [
        {"label": LABEL_MAP.get(item["label"].lower(), item["label"].lower()),
         "score": round(item["score"], 4)}
        for item in raw
    ]

    # Sort by score descending
    emotions.sort(key=lambda x: x["score"], reverse=True)
    dominant = emotions[0]

    return {
        "dominant": dominant,
        "emotions": emotions,
    }


# ── POST /analyse ─────────────────────────────────────────────
@app.route("/analyse", methods=["POST"])
def analyse():
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "Request must include a 'text' field."}), 400

    text = str(data["text"]).strip()
    if not text:
        return jsonify({"error": "Text cannot be empty."}), 400
    if len(text) > 5000:
        return jsonify({"error": "Text exceeds 5000 character limit."}), 400

    try:
        result = analyse_text(text)
        return jsonify(result)
    except Exception as e:
        print(f"ML error: {e}")
        return jsonify({"error": "Analysis failed."}), 500


# ── GET /health ───────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "emotion-english-distilroberta-base"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
