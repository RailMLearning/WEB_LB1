var selectedDeleteIsu = null;
var selectionRequest = 0;

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
