from flask import Flask, jsonify, request
from flask_cors import CORS
import glob
import json
import os
import re

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE_FILE_PATTERN = re.compile(r"^questions-([a-z0-9]+)\.json$", re.IGNORECASE)


def available_question_files():
    files = {}
    for path in glob.glob(os.path.join(BASE_DIR, "questions-*.json")):
        match = STATE_FILE_PATTERN.match(os.path.basename(path))
        if match:
            files[match.group(1).lower()] = path
    return files


def load_questions(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def validate_question(question):
    return (
        isinstance(question, dict)
        and isinstance(question.get("question"), str)
        and isinstance(question.get("options"), list)
        and len(question["options"]) == 4
        and isinstance(question.get("answer"), int)
        and 0 <= question["answer"] <= 3
    )


@app.route("/api/states")
def get_states():
    # Adding questions-xx.json automatically adds xx to this response.
    states = [{"code": code, "name": code.upper()} for code in sorted(available_question_files())]
    return jsonify({"states": states})


@app.route("/api/questions")
def get_questions():
    state = request.args.get("state", "").strip().lower()
    files = available_question_files()
    question_file = files.get(state)

    if not question_file:
        return jsonify({"error": "Unknown or missing state"}), 404

    try:
        data = load_questions(question_file)
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Unable to load question file"}), 500

    if not isinstance(data, list) or not all(validate_question(q) for q in data):
        return jsonify({"error": "Invalid question format"}), 500

    return jsonify({
        "meta": {"state": state, "lastModified": os.path.getmtime(question_file)},
        "questions": data,
    })


@app.route("/api/questions/<state>/metadata")
def question_metadata(state):
    question_file = available_question_files().get(state.lower())
    if not question_file:
        return jsonify({"error": "Unknown state"}), 404
    return jsonify({"state": state.lower(), "lastModified": os.path.getmtime(question_file)})


if __name__ == "__main__":
    app.run(port=3000)
