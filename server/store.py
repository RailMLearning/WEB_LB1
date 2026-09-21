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

def delete_student_by_id(isu):
    with open(DB_PATH, encoding="utf-8") as db:
        students = json.load(db)

    key = str(isu)
    if key not in students:
        return False

    del students[key]
    with open(DB_PATH, "w", encoding="utf-8") as db:
        json.dump(students, db, ensure_ascii=False, indent=4)
    return True
