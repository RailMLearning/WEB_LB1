function createStudentRow(student) {
    const row = document.createElement("tr");
    const panel = document.createElement("td");
    panel.className = "panel";
    for (const [action, label] of [["edit", "Изменить"], ["delete", "Удалить"], ["more", "Подробнее"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `btn btn-${action}`;
        button.dataset.action = action;
        button.dataset.isu = student.isu;
        button.textContent = label;
        panel.appendChild(button);
    }
    row.appendChild(panel);
    for (const field of ["fio", "grid", "isu", "dnum", "rnum"]) {
        const cell = document.createElement("td");
        cell.textContent = formatStudentText(student[field]);
        row.appendChild(cell);
    }
    return row;
}

let tableRequest = 0;
let studentFilters = {};
async function updateTables() {
    const request = ++tableRequest;
    const status = document.getElementById("table-status");
    try {
        const students = await getAllStudents(studentFilters);
        if (request !== tableRequest) return;
        document.getElementById("students-tbody").replaceChildren(...students.map(createStudentRow));
        if (status) status.textContent = students.length ? `Студентов: ${students.length}` : "Студенты не найдены.";
    } catch (error) {
        if (request === tableRequest && status) status.textContent = "Не удалось обновить список. " + error.message;
    }
}

const filterForm = document.getElementById("student-filters");
filterForm.addEventListener("submit", event => {
    event.preventDefault();
    studentFilters = Object.fromEntries(
        [...new FormData(filterForm)].map(([field, value]) => [field, value.trim()])
    );
    updateTables();
});
filterForm.addEventListener("reset", () => {
    studentFilters = {};
    updateTables();
});
