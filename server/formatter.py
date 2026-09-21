def format_student(data):
    result = {
        field: value.strip() if isinstance(value, str) else value
        for field, value in data.items()
    }
    if isinstance(result.get("fio"), str):
        result["fio"] = " ".join(result["fio"].split())
    return result
