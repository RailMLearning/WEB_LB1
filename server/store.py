import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "db.json"

def get_student_by_id(isu):
    with open(DB_PATH, encoding="utf-8") as db:
        students = json.load(db)
    return students.get(str(isu))

def get_all_students():
    with open(DB_PATH, encoding="utf-8") as db:
        students = json.load(db)
    return list(students.values())
