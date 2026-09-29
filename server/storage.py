import json
import os
import tempfile
from pathlib import Path
from threading import RLock

from server.settings import BASE_DIR


DB_PATH = Path(os.environ.get("DB_PATH", BASE_DIR / "server/db.json"))
_students_lock = RLock()


def load_students():
    if not DB_PATH.exists():
        return []
    with open(DB_PATH, encoding="utf-8") as db:
        return json.load(db)


def write_students(students):
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    file_descriptor, temporary_path = tempfile.mkstemp(dir=DB_PATH.parent, prefix=".db-", suffix=".tmp")
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as db:
            json.dump(students, db, ensure_ascii=False, indent=4)
            db.flush()
            os.fsync(db.fileno())
        os.replace(temporary_path, DB_PATH)
    except Exception:
        try:
            os.unlink(temporary_path)
        except FileNotFoundError:
            pass
        raise


def update_students(change):
    with _students_lock:
        students = load_students()
        changed, result = change(students)
        if changed:
            write_students(students)
        return result


def read_students():
    with _students_lock:
        return load_students()