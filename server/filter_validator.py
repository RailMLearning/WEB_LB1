import re

from server.validator import _error, validate_student


FIELDS = {"isu", "fio", "grid", "dnum", "rnum", "expdate", "foreigner", "notes"}
REQUIRED_FIELDS = FIELDS - {"notes"}
FILTER_ALIASES = {"group": "grid", "dormitory": "dnum"}
GRID_PATTERN = re.compile(r"^[A-Z][0-9]{4}[a-z]?$")
DATE_PATTERN = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
ISU_PATTERN = re.compile(r"^[0-9]{5,7}$")

def validate_filters(filters):
	if not isinstance(filters, dict):
		return None, [_error("body", "Тело запроса должно быть JSON-объектом.")]

	values = {}
	errors = []
	for name, value in filters.items():
		field = FILTER_ALIASES.get(name, name)
		if field not in FIELDS:
			errors.append(_error(name, "Неизвестный фильтр."))
		elif field in values:
			errors.append(_error(name, "Фильтр указан дважды."))
		elif isinstance(value, str) and not value.strip():
			continue
		elif field in ("fio", "notes"):
			if not isinstance(value, str):
				errors.append(_error(name, "Фильтр должен быть строкой."))
			else:
				values[field] = value.strip().casefold()
		else:
			result, field_errors = validate_student({field: value}, partial=True)
			errors.extend(field_errors)
			if not field_errors:
				values[field] = result[field]
	return (values, []) if not errors else (None, errors)