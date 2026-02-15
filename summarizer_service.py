from flask import Flask, request, jsonify
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from flask_cors import CORS
import re
import uuid
import os
import torch
from gtts import gTTS

app = Flask(__name__)
CORS(app)

# Service State
service_ready = False

# Ensure static directory exists
if not os.path.exists("static"):
    os.makedirs("static")

# Helper: Detect Tamil
def contains_tamil(text):
    return bool(re.search(r'[\u0B80-\u0BFF]', text))

# Helper: Detect Heavy Math
def is_math_heavy(text):
    math_patterns = [
        r"[=×÷±∈∉≤≥≈≠√∑∏∞ℝℤℕ]",
        r"\{.*?\}",
        r"\(.*?,.*?\)",
        r"\b[A-Z]\s*×\s*[A-Z]\b",
        r"n\s*\(\s*[A-Z]\s*\)",
    ]
    return any(re.search(p, text) for p in math_patterns)

# STEP 1: Tamil objects
tamil_tokenizer = None
tamil_model = None

# STEP 2: Tamil Loader
def load_tamil_model():
    global tamil_tokenizer, tamil_model
    if tamil_model is None:
        print("Loading Tamil IndicBART model (Tokenizer + Model)...")
        try:
            tamil_tokenizer = AutoTokenizer.from_pretrained(
                "ai4bharat/indicbart",
                use_fast=False
            )
            tamil_model = AutoModelForSeq2SeqLM.from_pretrained(
                "ai4bharat/indicbart"
            )
        except Exception as e:
            print(f"Warning: Failed to load Tamil model: {e}")
            return None, None
    return tamil_tokenizer, tamil_model

print("Loading English Summarizer (facebook/bart-large-cnn)...")
try:
    english_summarizer = pipeline(
        "summarization",
        model="facebook/bart-large-cnn"
    )
except Exception as e:
    print(f"CRITICAL: Failed to load English model: {e}")
    english_summarizer = None

# Pre-load Tamil Model to set service_ready accurately
load_tamil_model()

# Mark Service Ready
service_ready = True
print("Summarizer service ready")

@app.route("/health", methods=["GET"])
def health():
    if not service_ready:
        return jsonify({"status": "loading"}), 503
    return jsonify({"status": "ready"}), 200

@app.route("/summarize", methods=["POST"])
def summarize():
    if not service_ready:
        return jsonify({"error": "Service loading"}), 503

    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text or len(text) < 50:
            return jsonify({"error": "Insufficient text"}), 400

        if is_math_heavy(text):
            return jsonify({
                "error": "Mathematical content summarization not supported"
            }), 400

        # NEW: Tamil path (Replacing pipeline with manual generate)
        if contains_tamil(text):
            print("Detected Tamil Text")
            tokenizer, model = load_tamil_model()
            
            if not model or not tokenizer:
                return jsonify({"error": "Tamil model not loaded"}), 503

            # Input prep for IndicBART (It often requires <lang> tags if multilingual, 
            # but user prompt says: f"<ta> {text} </ta>")
            input_text = f"<ta> {text} </ta>"

            inputs = tokenizer(
                input_text,
                return_tensors="pt",
                max_length=1024,
                truncation=True
            )

            # Generate
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=200,
                min_length=80,
                num_beams=4,
                early_stopping=True
            )

            summary_text = tokenizer.decode(
                summary_ids[0],
                skip_special_tokens=True
            )

            return jsonify({
                "summary": summary_text,
                "language": "ta"
            })

        # EXISTING English path
        print("Detected English Text")
        if not english_summarizer:
            return jsonify({"error": "English model failed to load"}), 500

        summary_result = english_summarizer(
            text,
            max_length=180,
            min_length=80,
            do_sample=False,
            truncation=True
        )

        return jsonify({
            "summary": summary_result[0]["summary_text"],
            "language": "en"
        })

    except Exception as e:
        print(f"Summarize Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/voice-summary", methods=["POST"])
def voice_summary():
    try:
        data = request.get_json()
        text = data.get("text", "")
        lang = data.get("language", "en") # 'ta' or 'en'

        if not text:
            return jsonify({"error": "No text"}), 400

        if not isinstance(text, str):
            return jsonify({"error": "Voice text must be string"}), 400

        if len(text.strip()) < 10:
            return jsonify({"error": "Voice text too short"}), 400

        filename = f"voice_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        
        # gTTS supports 'ta' for Tamil
        tts = gTTS(text=text, lang="ta" if lang == "ta" else "en")
        tts.save(filepath)

        return jsonify({ "audio": f"http://localhost:5001/static/{filename}" })

    except Exception as e:
        print(f"Voice Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Python Summarizer Service on port 5001...")
    app.run(port=5001)
