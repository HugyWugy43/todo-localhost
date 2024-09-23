from flask import Flask, jsonify, request, render_template
import json
import os
import yaml
from datetime import datetime

app = Flask(__name__)

# Paths to the JSON and YAML files
TASKS_FILE = "data/tasks.json"
CATEGORIES_FILE = "data/categories.yaml"
NOTES_FILE = "data/notes.md"
# Ensure the tasks.json file exists
if not os.path.exists(TASKS_FILE):
    with open(TASKS_FILE, "w") as f:
        json.dump([], f)


# Load tasks from the JSON file
def load_tasks():
    with open(TASKS_FILE, "r") as file:
        tasks = json.load(file)
    return tasks


# Save tasks to the JSON file
def save_tasks(tasks):
    with open(TASKS_FILE, "w") as file:
        json.dump(tasks, file)


# Load categories from the YAML file
def load_categories():
    with open(CATEGORIES_FILE, "r") as file:
        data = yaml.safe_load(file)
    return data.get("categories", [])


@app.route("/notes", methods=["GET"])
def get_notes():
    try:
        notes = load_notes()  # Use the load_notes function
        return jsonify({"notes": notes}), 200
    except IOError as e:
        return jsonify({"error": "Failed to read notes file"}), 500


if not os.path.exists(NOTES_FILE):
    with open(NOTES_FILE, "w") as file:
        file.write("")  # Initialize with empty content


# Read notes from the file
def load_notes():
    if os.path.exists(NOTES_FILE):
        with open(NOTES_FILE, "r") as file:
            content = file.read()
            return content if content.strip() else ""  # Avoid returning undefined
    return ""  # Return empty string if file doesn't exist


def save_notes(content):
    if content and content.strip():  # Only save non-empty, valid content
        with open(NOTES_FILE, "w") as file:
            file.write(content)


# Endpoint to save notes
@app.route("/notes", methods=["POST"])
def save_notes_endpoint():
    notes_content = request.json.get("notes", "")
    if (
        notes_content
    ):  # Only save if there is content to avoid overwriting with empty data
        save_notes(notes_content)
    return jsonify({"status": "success"})


# Serve the HTML page
@app.route("/")
def index():
    categories = load_categories()
    return render_template("index.html", categories=categories)


# Endpoint to get all tasks
@app.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = load_tasks()
    return jsonify(tasks)


# Endpoint to add/update tasks
@app.route("/tasks", methods=["POST"])
def save_task():
    tasks = request.json.get("tasks", [])

    # Automatically add completion date when a task is marked as completed
    for task in tasks:
        if task.get("completed") and not task.get("completedDate"):
            # Set the completedDate to today's date when the task is marked as completed
            task["completedDate"] = datetime.now().strftime("%Y-%m-%d")
        elif not task.get("completed"):
            # If the task is unchecked, remove the completedDate
            task["completedDate"] = None

    save_tasks(tasks)
    return jsonify({"status": "success"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4200)
