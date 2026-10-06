from pydantic import ValidationError

from server.models import StudentCreate, StudentUpdate


def _error(field, message):
    return {"field": field, "message": message}


def validation_errors(errors):
    result = []
    for error in errors:
        location = error.get("loc", ())
        field = str(location[-1]) if location else "body"
        if error["type"] == "missing":
            message = "Поле обязательно."
        elif error["type"] == "extra_forbidden":
            message = "Неизвестное поле."
        elif error.get("ctx", {}).get("error") is not None:
            message = str(error["ctx"]["error"])
        else:
            message = error["msg"]
        result.append(_error(field, message))
    return result


def validate_student(data, partial=False):
    if not isinstance(data, dict):
        return None, [_error("body", "Тело запроса должно быть JSON-объектом.")]
    model = StudentUpdate if partial else StudentCreate
    try:
        student = model.model_validate(data)
    except ValidationError as error:
        return None, validation_errors(error.errors())
    return student.model_dump(exclude_unset=partial), []
