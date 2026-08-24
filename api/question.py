from flask import Flask, jsonify
import json, os

app = Flask(__name__)

@app.route("/api/questions")
def questions():
    with open(../"questions.json") as f:
        data = json.load(f)
    return jsonify({
        "meta": { "lastModified": os.path.getmtime("questions.json") },
        "questions": data
    })

app.run(port=3000)
