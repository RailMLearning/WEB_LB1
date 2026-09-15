function showError(message = "") {
    document.getElementById("error").textContent = message;
}

function hideError() {
    showError("");
}

function formatStudentText(value, fallback = "Не указано") {
    if (value === undefined || value === null) return fallback;
    const text = String(value).trim();
    return text === "" ? fallback : text;
}

function formatStudentDate(value) {
    const text = formatStudentText(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parts = text.split("-");
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatStudentForeign(value) {
    if (value === true || value === "true" || value === "on") return "Да";
    if (value === false || value === "false" || value === undefined || value === "") return "Нет";
    return "Не указано";
}
