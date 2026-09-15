function formatStudentText(value, fallback = "Не указано") {
    if (value === undefined || value === null) {
        return fallback;
    }

    const text = String(value).trim();
    return text === "" ? fallback : text;
}

function formatStudentDate(value) {
    const text = formatStudentText(value);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    const parts = text.split("-");
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatStudentForeign(value) {
    if (value === true || value === "true" || value === "on") {
        return "Да";
    }
    if (value === false || value === "false" || value === undefined || value === "") {
        return "Нет";
    }
    return "Не указано";
}

let studentDetailsRequest = 0;

function showStudentDetails(student) {
    studentDetailsRequest += 1;

    const body = document.getElementById("more-info");
    const status = document.getElementById("student-details-status");
    body.replaceChildren();

    if (!student || typeof student !== "object" || Array.isArray(student)) {
        status.textContent = "Студент не найден.";
        openModal("more-info-modal");
        return;
    }

    const fields = [
        ["ФИО", formatStudentText(student.fio)],
        ["Группа", formatStudentText(student.grid)],
        ["ИСУ ID", formatStudentText(student.isu)],
        ["Номер общежития", formatStudentText(student.dnum)],
        ["Комната", formatStudentText(student.rnum)],
        ["Срок заселения", formatStudentDate(student.expdate)],
        ["Иностранец", formatStudentForeign(student.foreigner ?? student.foreign)],
        ["Заметки", formatStudentText(student.notes, "Нет заметок")]
    ];

    for (const [label, value] of fields) {
        const row = document.createElement("tr");
        const heading = document.createElement("th");
        const cell = document.createElement("td");

        heading.scope = "row";
        heading.textContent = label;
        cell.textContent = value;
        row.append(heading, cell);
        body.appendChild(row);
    }

    status.textContent = "";
    openModal("more-info-modal");
}

async function readStudentDetails(isu) {
    return getStudentById(isu);
}

async function showStudentDetailsById(isu) {
    const request = ++studentDetailsRequest;
    const body = document.getElementById("more-info");
    const status = document.getElementById("student-details-status");

    body.replaceChildren();
    status.textContent = "Загрузка…";
    openModal("more-info-modal");

    try {
        const student = await readStudentDetails(isu);
        if (request !== studentDetailsRequest) return;
        if (!document.getElementById("more-info-modal").classList.contains("active")) return;

        showStudentDetails(student);
    } catch (error) {
        if (request !== studentDetailsRequest) return;
        status.textContent = "Не удалось загрузить досье. " + error.message;
    }
}
