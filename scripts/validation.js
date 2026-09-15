function validateId(isu = "") {
    return /^\d{5,7}$/.test(isu);
}

function getStudentFormData(form) {
    const data = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(data)) {
        data[key] = data[key].trim();
    }
    data.foreigner = form.elements.namedItem("foreigner").checked ? "true" : "false";
    return data;
}

function validateStudent(data) {
    if (!validateId(data.isu)) {
        return { field: "isu", message: "ИСУ ID должен содержать от 5 до 7 цифр." };
    }
    if (data.fio.length > 150 || !/^\p{L}[\p{L}\p{M}'’\-]*(?:\s+\p{L}[\p{L}\p{M}'’\-]*)+$/u.test(data.fio)) {
        return { field: "fio", message: "Введите фамилию и имя буквами, через пробел. Допустимы дефис и апостроф, максимум 150 символов." };
    }
    if (!/^[\p{L}\d-]{2,20}$/u.test(data.grid)) {
        return { field: "grid", message: "Группа: от 2 до 20 символов, только буквы, цифры и дефис." };
    }
    for (const field of ["dnum", "rnum"]) {
        if (!/^\d+$/.test(data[field]) || !Number.isSafeInteger(Number(data[field])) || Number(data[field]) < 1) {
            return { field, message: "Номер общежития и комнаты должен быть положительным целым числом." };
        }
    }
    const date = new Date(`${data.expdate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.expdate) || Number(data.expdate.slice(0, 4)) < 1 || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.expdate) {
        return { field: "expdate", message: "Укажите существующую календарную дату." };
    }
    if (data.notes.length > 500) {
        return { field: "notes", message: "Заметки не должны превышать 500 символов." };
    }
    return null;
}

function showStudentFormError(form, error) {
    const input = form.elements.namedItem(error.field);
    input.setCustomValidity(error.message);
    showError(error.message);
    input.reportValidity();
}
