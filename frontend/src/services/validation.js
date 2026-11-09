export function validateAuth(data, registering = false) {
    const errors = {};
    if (!/^[a-z0-9_]{3,40}$/i.test(data.username.trim())) {
        errors.username = "Логин: 3–40 латинских букв, цифр или подчёркиваний.";
    }
    if (data.password.length < 8 || new TextEncoder().encode(data.password).length > 72) {
        errors.password = "Пароль: минимум 8 символов и максимум 72 байта UTF-8.";
    }
    if (registering && (
        data.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    )) errors.email = "Введите корректную электронную почту.";
    return errors;
}

export function emptyStudent() {
    return {
        isu: "", fio: "", grid: "", dnum: "", rnum: "",
        expdate: "", foreigner: false, notes: ""
    };
}

export function validateStudent(data) {
    const errors = {};
    if (!/^[0-9]{5,7}$/.test(data.isu.trim())) errors.isu = "ИСУ должен содержать 5–7 цифр.";
    const name = data.fio.trim();
    if (name.length > 150 || !/^\p{L}[\p{L}\p{M}'’\-]*(?:\s+\p{L}[\p{L}\p{M}'’\-]*)*$/u.test(name)) {
        errors.fio = "Введите имя буквами. Допустимы пробел, дефис и апостроф, до 150 символов.";
    }
    if (!/^[A-Z][0-9]{4}[a-z]?$/.test(data.grid.trim())) {
        errors.grid = "Используйте формат M3301 или M3301a.";
    }
    for (const field of ["dnum", "rnum"]) {
        const value = String(data[field]).trim();
        if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
            errors[field] = "Введите положительное целое число.";
        }
    }
    const date = new Date(`${data.expdate}T00:00:00Z`);
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.expdate) ||
        data.expdate < "1900-01-01" || data.expdate > "9999-12-31" ||
        Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.expdate) {
        errors.expdate = "Введите существующую дату от 1900 до 9999 года.";
    }
    if (data.notes.trim().length > 500) errors.notes = "В заметках допускается до 500 символов.";
    return errors;
}

export function fieldErrors(error) {
    return Object.fromEntries((error.details || [])
        .filter(item => item.field)
        .map(item => [item.field, item.message || item.msg]));
}

export function formatDate(value) {
    return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value || "")
        ? value.split("-").reverse().join(".") : "Не указано";
}
