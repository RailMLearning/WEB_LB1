function createStudentRow(student) {
    const row = document.createElement("tr");
    const panel = document.createElement("td");
    panel.className = "panel";
    for (const [action, label] of [
        ["edit", "Изменить"],
        ["delete", "Удалить"],
        ["more", "Подробнее"]
    ]) {
        if (action !== "more" && authUser?.role !== "ADMIN") continue;
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
let studentPage = 0;
let studentTotal = 0;
async function updateTables() {
    if (!authUser) return;
    const request = ++tableRequest;
    const status = document.getElementById("table-status");
    try {
        const size = Number(document.getElementById("page-size").value);
        const students = await getAllStudents({ ...studentFilters, page: studentPage, size });
        if (request !== tableRequest) return;
        studentTotal = students.total;
        if (!students.length && studentPage > 0 && studentPage * size >= studentTotal) {
            studentPage = Math.max(0, Math.ceil(studentTotal / size) - 1);
            return updateTables();
        }
        document
            .getElementById("students-tbody")
            .replaceChildren(...students.map(createStudentRow));
        if (status)
            status.textContent = studentTotal
                ? `Всего: ${studentTotal}. На странице: ${students.length}.`
                : "Студенты не найдены.";
        document.getElementById("page-status").textContent =
            `Страница ${studentPage + 1} из ${Math.max(1, Math.ceil(studentTotal / size))}`;
        document.getElementById("page-prev").disabled = studentPage === 0;
        document.getElementById("page-next").disabled = (studentPage + 1) * size >= studentTotal;
    } catch (error) {
        if (request === tableRequest && status)
            status.textContent = "Не удалось обновить список. " + error.message;
    }
}

const filterForm = document.getElementById("student-filters");
filterForm.addEventListener("submit", event => {
    event.preventDefault();
    studentFilters = Object.fromEntries(
        [...new FormData(filterForm)].map(([field, value]) => [field, value.trim()])
    );
    studentPage = 0;
    updateTables();
});
filterForm.addEventListener("reset", () => {
    studentFilters = {};
    studentPage = 0;
    updateTables();
});

document.getElementById("page-prev").addEventListener("click", () => {
    if (studentPage > 0) {
        studentPage -= 1;
        updateTables();
    }
});
document.getElementById("page-next").addEventListener("click", () => {
    studentPage += 1;
    updateTables();
});
document.getElementById("page-size").addEventListener("change", () => {
    studentPage = 0;
    updateTables();
});
