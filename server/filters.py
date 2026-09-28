from server.validator import FIELDS, validate_student


def filter_students(students, filters):
    aliases = {"group": "grid", "dormitory": "dnum"}
    values = {}
    errors = []
    for name, value in filters.items():
        field = aliases.get(name, name)
        if field not in FIELDS:
            errors.append({"field": name, "message": "Неизвестный фильтр."})
        elif field in values:
            errors.append({"field": name, "message": "Фильтр указан дважды."})
        elif isinstance(value, str) and not value.strip():
            continue
        elif field in ("fio", "notes"):
            if not isinstance(value, str):
                errors.append({"field": name, "message": "Фильтр должен быть строкой."})
            else:
                values[field] = value.strip().casefold()
        else:
            result, field_errors = validate_student({field: value}, partial=True)
            errors.extend(field_errors)
            if not field_errors:
                values[field] = result[field]
    if errors:
        return None, errors
    result = []
    for student in students:
        matches = True
        for field, value in values.items():
            actual = student.get(field)
            if field in ("fio", "notes"):
                matches = value in str(actual or "").casefold()
            else:
                matches = str(actual).lower() == str(value).lower()
            if not matches:
                break
        if matches:
            result.append(student)
    return result, []
