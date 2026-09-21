import re
import unicodedata
from datetime import datetime

from server.formatter import format_student


FIELDS = {"isu", "fio", "grid", "dnum", "rnum", "expdate", "foreigner", "notes"}
REQUIRED_FIELDS = FIELDS - {"notes"}
GRID_PATTERN = re.compile(r"^[A-Z][0-9]{4}[a-z]?$")
DATE_PATTERN = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
ISU_PATTERN = re.compile(r"^[0-9]{5,7}$")


def _valid_fio(value):
	if not isinstance(value, str) or not value or len(value) > 150:
		return False
	for word in value.split(" "):
		if not word or not unicodedata.category(word[0]).startswith("L"):
			return False
		if any(unicodedata.category(char)[0] not in ("L", "M") and char not in "'’-" for char in word):
			return False
	return True


def _error(field, message):
	return {"field": field, "message": message}


def validate_student(data, partial=False):
	if not isinstance(data, dict):
		return None, [_error("body", "Тело запроса должно быть JSON-объектом.")]

	errors = []
	unknown_fields = set(data) - FIELDS
	if unknown_fields:
		errors.extend(_error(field, "Неизвестное поле.") for field in sorted(unknown_fields))

	if not partial:
		errors.extend(_error(field, "Поле обязательно.") for field in sorted(REQUIRED_FIELDS - set(data)))

	if errors:
		return None, errors

	data = format_student(data)
	result = dict(data)

	if "isu" in data:
		if not isinstance(data["isu"], str) or not ISU_PATTERN.fullmatch(data["isu"]):
			errors.append(_error("isu", "ИСУ ID должен содержать от 5 до 7 цифр."))

	if "fio" in data:
		value = data["fio"]
		if not _valid_fio(value):
			errors.append(_error("fio", "Введите фамилию и имя или одно слово буквами. Допустимы дефис и апостроф, максимум 150 символов."))

	if "grid" in data:
		value = data["grid"]
		if not isinstance(value, str) or not GRID_PATTERN.fullmatch(value):
			errors.append(_error("grid", "Группа должна иметь формат: заглавная латинская буква, 4 цифры и необязательная строчная буква."))

	for field in ("dnum", "rnum"):
		if field not in data:
			continue
		value = data[field]
		if isinstance(value, bool) or (not isinstance(value, (str, int)) or isinstance(value, float)):
			errors.append(_error(field, "Номер должен быть положительным целым числом."))
			continue
		if isinstance(value, str) and not re.fullmatch(r"[0-9]+", value):
			errors.append(_error(field, "Номер должен быть положительным целым числом."))
			continue
		if isinstance(value, str):
			value = value.lstrip("0") or "0"
			if len(value) > 16:
				errors.append(_error(field, "Номер должен быть положительным целым числом."))
				continue
		number = int(value)
		if number < 1 or number > 9007199254740991:
			errors.append(_error(field, "Номер должен быть положительным целым числом."))
		else:
			result[field] = number

	if "expdate" in data:
		value = data["expdate"]
		valid_date = isinstance(value, str) and DATE_PATTERN.fullmatch(value)
		if valid_date:
			try:
				date = datetime.strptime(value, "%Y-%m-%d")
				valid_date = 1900 <= date.year <= 9999
			except ValueError:
				valid_date = False
		if not valid_date:
			errors.append(_error("expdate", "Дата должна быть существующей календарной датой в диапазоне от 01.01.1900 до 31.12.9999."))

	if "foreigner" in data:
		value = data["foreigner"]
		if value == "true" or value is True:
			result["foreigner"] = True
		elif value == "false" or value is False:
			result["foreigner"] = False
		else:
			errors.append(_error("foreigner", "Поле должно иметь значение true или false."))

	if "notes" in data:
		value = data["notes"]
		if not isinstance(value, str) or len(value) > 500:
			errors.append(_error("notes", "Заметки не должны превышать 500 символов."))

	if errors:
		return None, errors
	if not partial:
		result.setdefault("notes", "")
	return result, []
