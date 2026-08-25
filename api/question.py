from flask import Flask, jsonify
import json, os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUESTIONS_FILE = os.path.join(BASE_DIR, "questions.json")

def load_questions():
    with open(QUESTIONS_FILE, "r") as f:
        data = json.load(f)
    return data

def validate_question(q):
    return (
        isinstance(q.get("question"), str)
        and isinstance(q.get("options"), list)
        and len(q["options"]) == 4
        and isinstance(q.get("answer"), int)
        and 0 <= q["answer"] <= 3
    )

@app.route("/api/questions")
def get_questions():
    data = load_questions()

    if not isinstance(data, list) or not all(validate_question(q) for q in data):
        return jsonify({"error": "Invalid question format"}), 500

    last_modified = os.path.getmtime(QUESTIONS_FILE)

    return jsonify({
        "meta": { "lastModified": last_modified },
        "questions": data
    })

@app.route("/api/last-modified")
def last_modified():
    ts = os.path.getmtime(QUESTIONS_FILE)
    return jsonify({ "lastModified": ts })

if __name__ == "__main__":
    app.run(port=3000)
