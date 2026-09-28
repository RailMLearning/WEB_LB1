import json
import os
import tempfile
from threading import RLock
from pathlib import Path

from server.settings import BASE_DIR

DB_PATH = BASE_DIR / "server/db.json"
_students_lock = RLock()


def _load_students():
    with open(DB_PATH, encoding="utf-8") as db:
        return json.load(db)


def _write_students(students):
    file_descriptor, temporary_path = tempfile.mkstemp(dir=BASE_DIR, prefix=".db-", suffix=".tmp")
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


def _update_students(change):
    with _students_lock:
        students = _load_students()
        changed, result = change(students)
        if changed:
            _write_students(students)
        return result


def _student_with_string_isu(key, student):
    result = dict(student)
    result["isu"] = str(result.get("isu", key))
    return result


def get_student_by_id(isu):
    key = str(isu)
    with _students_lock:
        students = _load_students()
    for student in students:
        if str(student.get("isu")) == key:
            return _student_with_string_isu(key, student)
    return None


def get_all_students():
    with _students_lock:
        students = _load_students()
    return [_student_with_string_isu(student.get("isu"), student) for student in students]


def create_student(student):
    isu = str(student["isu"])
    value = {**student, "isu": isu}

    def add_student(students):
        if any(str(s.get("isu")) == isu for s in students):
            return False, None
        students.append(value)
        return True, value

    return _update_students(add_student)


def update_student(isu, updates, validate):
    key = str(isu)

    def change_student(students):
        index = next((i for i, s in enumerate(students) if str(s.get("isu")) == key), None)
        if index is None:
            return False, ("not_found", None)

        current = students[index]
        updated = {**_student_with_string_isu(key, current), **updates}
        updated, errors = validate(updated)
        if errors:
            return False, ("invalid", errors)

        new_key = str(updated["isu"])
        if new_key != key and any(str(s.get("isu")) == new_key for s in students):
            return False, ("conflict", None)

        updated["isu"] = new_key
        students[index] = updated
        return True, ("updated", updated)

    return _update_students(change_student)


def delete_student_by_id(isu):
    key = str(isu)

    def remove_student(students):
        index = next((i for i, s in enumerate(students) if str(s.get("isu")) == key), None)
        if index is None:
            return False, False
        del students[index]
        return True, True

    return _update_students(remove_student)