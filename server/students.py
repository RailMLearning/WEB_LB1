from server.storage import read_students, update_students


def _student_with_string_isu(key, student):
    result = dict(student)
    result["isu"] = str(result.get("isu", key))
    return result


def get_student_by_id(isu):
    key = str(isu)
    for student in read_students():
        if str(student.get("isu")) == key:
            return _student_with_string_isu(key, student)
    return None


def get_all_students():
    students = read_students()
    return [_student_with_string_isu(student.get("isu"), student) for student in students]


def students_filters(students, filters):
    result = []
    for student in students:
        if all(
            value in str(student.get(field) or "").casefold()
            if field in ("fio", "notes")
            else str(student.get(field)).casefold() == str(value).casefold()
            for field, value in filters.items()
        ):
            result.append(student)
    return result


def create_student(student):
    isu = str(student["isu"])
    value = {**student, "isu": isu}

    def add_student(students):
        if any(str(item.get("isu")) == isu for item in students):
            return False, None
        students.append(value)
        return True, value

    return update_students(add_student)


def update_student(isu, updates, validate):
    key = str(isu)

    def change_student(students):
        index = next((i for i, item in enumerate(students) if str(item.get("isu")) == key), None)
        if index is None:
            return False, ("not_found", None)

        current = students[index]
        updated = {**_student_with_string_isu(key, current), **updates}
        updated, errors = validate(updated)
        if errors:
            return False, ("invalid", errors)

        new_key = str(updated["isu"])
        if new_key != key and any(str(item.get("isu")) == new_key for item in students):
            return False, ("conflict", None)

        updated["isu"] = new_key
        students[index] = updated
        return True, ("updated", updated)

    return update_students(change_student)


def delete_student_by_id(isu):
    key = str(isu)

    def remove_student(students):
        index = next((i for i, item in enumerate(students) if str(item.get("isu")) == key), None)
        if index is None:
            return False, False
        del students[index]
        return True, True

    return update_students(remove_student)