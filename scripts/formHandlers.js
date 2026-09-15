const studentForm = document.getElementById("studform");
var originalIsu = null;
var saving = false;
var isUpdatingCookie = false;

function prepareStudentForm(student = null) {
    studentForm.reset();
    for (const input of Array.from(studentForm.elements || [])) input.setCustomValidity?.("");
    hideError();
    originalIsu = student?.isu ?? null;
    const title = document.getElementById("form-title");
    if (title) title.textContent = student ? "Редактирование студента" : "Добавление студента";
    if (student) for (const field of studentFields) {
        const input = studentForm.elements.namedItem(field);
        if (!input) continue;
        if (field === "foreigner") input.checked = formatStudentForeign(student.foreigner ?? student.foreign) === "Да";
        else input.value = student[field] ?? "";
    }
    openModal("form-modal");
}

function attachFormHandlers() {
    if (studentForm.__handlersAttached) return;
    studentForm.__handlersAttached = true;
    studentForm.addEventListener("input", event => { event.target.setCustomValidity(""); hideError(); });
    studentForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (saving) return;
        hideError();
        const data = getStudentFormData(studentForm);
        const error = validateStudent(data);
        if (error) return showStudentFormError(studentForm, error);
        saving = true;
        isUpdatingCookie = true;
        const controls = Array.from(studentForm.elements || []);
        controls.forEach(control => { control.disabled = true; });
        try {
            await saveStudent(data, originalIsu);
            studentForm.reset();
            closeModal("form-modal");
            await updateTables();
        } catch (error) {
            if (error.field) showStudentFormError(studentForm, error);
            else showError(error.message);
        } finally {
            saving = false;
            isUpdatingCookie = false;
            controls.forEach(control => { control.disabled = false; });
        }
    });
}

attachFormHandlers();
