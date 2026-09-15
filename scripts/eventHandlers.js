const studentForm = document.getElementById("studform");
let originalIsu = null;
let selectedDeleteIsu = null;
let selectionRequest = 0;
let saving = false;

function prepareStudentForm(student = null) {
    studentForm.reset();
    for (const input of studentForm.elements) input.setCustomValidity?.("");
    hideError();
    originalIsu = student?.isu ?? null;
    document.getElementById("form-title").textContent = student ? "Редактирование студента" : "Добавление студента";
    if (student) {
        for (const field of studentFields) {
            const input = studentForm.elements.namedItem(field);
            if (field === "foreigner") {
                input.checked = formatStudentForeign(student.foreigner ?? student.foreign) === "Да";
            } else {
                input.value = student[field] ?? "";
            }
        }
    }
    openModal("form-modal");
}

document.getElementById("btn-add").addEventListener("click", () => {
    selectionRequest += 1;
    prepareStudentForm();
});

document.getElementById("table-students").addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const request = ++selectionRequest;
    const isu = button.dataset.isu;
    if (button.dataset.action === "more") {
        showStudentDetailsById(isu);
        return;
    }
    try {
        const student = await getStudentById(isu);
        if (request !== selectionRequest) return;
        if (!student) throw new Error("Студент не найден. Обновите список.");
        if (button.dataset.action === "edit") prepareStudentForm(student);
        if (button.dataset.action === "delete") {
            selectedDeleteIsu = isu;
            document.getElementById("delete-description").textContent = `Удалить ${student.fio} (ИСУ ${isu})?`;
            document.getElementById("delete-error").textContent = "";
            openModal("confirm-modal");
        }
    } catch (error) {
        document.getElementById("table-status").textContent = error.message;
    }
});

studentForm.addEventListener("input", event => {
    event.target.setCustomValidity("");
    hideError();
});

studentForm.addEventListener("invalid", event => {
    const firstInvalid = [...studentForm.elements].find(input => input.validity && !input.validity.valid);
    if (event.target !== firstInvalid) return;
    const label = event.target.labels?.[0]?.textContent.trim() || event.target.name;
    showError(`${label}: ${event.target.validationMessage}`);
}, true);

studentForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (saving) return;
    hideError();
    const data = getStudentFormData(studentForm);
    const error = validateStudent(data);
    if (error) {
        showStudentFormError(studentForm, error);
        return;
    }
    saving = true;
    modalBusy = true;
    const controls = [...studentForm.elements];
    controls.forEach(control => { control.disabled = true; });
    let saved = false;
    let failure = null;
    try {
        await saveStudent(data, originalIsu);
        saved = true;
    } catch (error) {
        failure = error;
    } finally {
        saving = false;
        modalBusy = false;
        controls.forEach(control => { control.disabled = false; });
    }
    if (saved) {
        closeModal("form-modal");
        await updateTables();
    } else if (failure.field) {
        showStudentFormError(studentForm, { field: failure.field, message: failure.message });
    } else {
        showError(failure.message);
    }
});

document.getElementById("confirm-delete").addEventListener("click", async () => {
    if (saving || !selectedDeleteIsu) return;
    saving = true;
    modalBusy = true;
    const controls = [...document.querySelectorAll("#confirm-modal button")];
    controls.forEach(control => { control.disabled = true; });
    let deleted = false;
    try {
        await deleteStudentById(selectedDeleteIsu);
        deleted = true;
    } catch (error) {
        document.getElementById("delete-error").textContent = error.message;
    } finally {
        saving = false;
        modalBusy = false;
        controls.forEach(control => { control.disabled = false; });
    }
    if (deleted) {
        selectedDeleteIsu = null;
        closeModal("confirm-modal");
        await updateTables();
    }
});

for (const button of document.querySelectorAll("[data-close]")) {
    button.addEventListener("click", () => closeModal(button.dataset.close));
}
