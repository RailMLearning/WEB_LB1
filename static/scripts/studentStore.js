const studentFields = ["isu", "fio", "grid", "dnum", "rnum", "expdate", "foreigner", "notes"];

async function readStudentResponse(response) {
    if (response.status === 204) return null;
    let body;
    try {
        body = await response.json();
    } catch {
        throw new Error(`Сервер вернул некорректный ответ (${response.status}).`);
    }
    if (!response.ok) {
        const detail = body.detail || body.message;
        const message = Array.isArray(detail)
            ? detail.map(item => item.message || item.msg).join("\n")
            : detail;
        const error = new Error(message || `Ошибка сервера: ${response.status}.`);
        error.field = Array.isArray(detail) ? detail[0]?.field : undefined;
        if (response.status === 409) error.field = "isu";
        throw error;
    }
    return body;
}

async function getAllStudents(filters = {}) {
    const entries = Object.entries(filters).filter(([, value]) => value !== "");
    let response;
    if (entries.length > 3) {
        response = await fetch("/api/requests", {
            method: "QUERY",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(entries))
        });
    } else {
        const query = new URLSearchParams(entries);
        response = await fetch(`/api/requests${query.size ? `?${query}` : ""}`);
    }
    const students = await readStudentResponse(response);
    if (!Array.isArray(students)) throw new Error("Сервер вернул список в неправильном формате.");
    return students;
}

async function getStudentById(isu) {
    const response = await fetch(`/api/requests/${encodeURIComponent(isu)}`);
    if (response.status === 404) return null;
    return readStudentResponse(response);
}

async function saveStudent(student, originalIsu = null) {
    const editing = originalIsu !== null;
    const url = editing ? `/api/requests/${encodeURIComponent(originalIsu)}` : "/api/requests";
    const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student)
    });
    return readStudentResponse(response);
}

async function deleteStudentById(isu) {
    const response = await fetch(`/api/requests/${encodeURIComponent(isu)}`, { method: "DELETE" });
    return readStudentResponse(response);
}
