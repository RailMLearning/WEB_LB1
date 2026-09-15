var selectedDeleteIsu = null;
var selectionRequest = 0;
var originalIsu = typeof originalIsu === "undefined" ? null : originalIsu;
var saving = typeof saving === "undefined" ? false : saving;

function prepareStudentForm(student = null) {
    const form = document.getElementById("studform");
    form.reset();
    for (const input of Array.from(form.elements || [])) input.setCustomValidity?.("");
    hideError();
    originalIsu = student?.isu ?? null;
    if (student) for (const field of studentFields) {
        const input = form.elements.namedItem(field);
        if (!input) continue;
        if (field === "foreigner") input.checked = formatStudentForeign(student.foreigner ?? student.foreign) === "Да";
        else input.value = student[field] ?? "";
    }
    openModal("form-modal");
}

function attachFormHandlers() {
    const form = document.getElementById("studform");
    if (form.__handlersAttached) return;
    form.__handlersAttached = true;
    form.addEventListener("input", event => { event.target.setCustomValidity(""); hideError(); });
    form.addEventListener("invalid", event => {
        const first = Array.from(form.elements || []).find(input => input.validity && !input.validity.valid);
        if (event.target !== first) return;
        const label = event.target.labels?.[0]?.textContent.trim() || event.target.name;
        showError(`${label}: ${event.target.validationMessage}`);
    }, true);
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (saving) return;
        const data = getStudentFormData(form);
        const error = validateStudent(data);
        if (error) return showStudentFormError(form, error);
        saving = true;
        const controls = Array.from(form.elements || []);
        controls.forEach(control => { control.disabled = true; });
        try {
            await saveStudent(data, originalIsu);
            closeModal("form-modal");
            await updateTables();
        } catch (error) {
            if (error.field) showStudentFormError(form, error);
            else showError(error.message);
        } finally {
            saving = false;
            controls.forEach(control => { control.disabled = false; });
        }
    });
}

const addButton = document.getElementById("btn-add");
addButton?.addEventListener("click", () => { selectionRequest += 1; prepareStudentForm(); });

document.getElementById("table-students")?.addEventListener("click", async event => {
    const button = event.target.closest?.("button[data-action]");
    if (!button) return;
    const request = ++selectionRequest;
    const isu = button.dataset.isu;
    if (button.dataset.action === "more") return showStudentDetailsById(isu);
    try {
        const student = await getStudentById(isu);
        if (request !== selectionRequest) return;
        if (!student) throw new Error("Студент не найден. Обновите список.");
        if (button.dataset.action === "edit") prepareStudentForm(student);
        if (button.dataset.action === "delete") {
            selectedDeleteIsu = isu;
            const description = document.getElementById("delete-description");
            if (description) description.textContent = `Удалить ${student.fio} (ИСУ ${isu})?`;
            openModal("confirm-modal");
        }
    } catch (error) {
        const status = document.getElementById("table-status");
        if (status) status.textContent = error.message;
    }
});

document.getElementById("confirm-delete")?.addEventListener("click", async () => {
    if (!selectedDeleteIsu || saving) return;
    saving = true;
    try {
        await deleteStudentById(selectedDeleteIsu);
        selectedDeleteIsu = null;
        closeModal("confirm-modal");
        await updateTables();
    } catch (error) { showError(error.message); }
    finally { saving = false; }
});

for (const button of document.querySelectorAll?.("[data-close]") || []) {
    button.addEventListener("click", () => closeModal(button.dataset.close));
}

attachFormHandlers();
