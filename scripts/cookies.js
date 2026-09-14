async function removeCookies() {
    for (const cookie of await cookieStore.getAll()) {
        await cookieStore.delete(cookie.name);
    }
}

let isUpdatingCookie = false;
const studentForm = document.getElementById("studform");

studentForm.addEventListener("input", (event) => {
    event.target.setCustomValidity("");
    hideError();
});

studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isUpdatingCookie) return;
    hideError();

    const data = getStudentFormData(studentForm);
    const error = validateStudent(data);
    if (error) {
        showStudentFormError(studentForm, error);
        return;
    }

    const submitButton = studentForm.querySelector('[type="submit"]');
    isUpdatingCookie = true;
    submitButton.disabled = true;

    try {
        if (!("cookieStore" in window)) {
            throw new Error("Хранилище недоступно. Откройте сайт через localhost в браузере с поддержкой Cookie Store API.");
        }
        const existing = await cookieStore.get(`isu_isu${data.isu}`);
        if (existing) {
            showStudentFormError(studentForm, { field: "isu", message: "Студент с таким ИСУ уже существует. Введите другой ИСУ." });
            return;
        }

        for (const [key, value] of Object.entries(data)) {
            await cookieStore.set({
                name: `${key}_isu${data.isu}`,
                value,
                expires: Date.now() + 24 * 60 * 60 * 1000,
                path: "/"
            });
        }
        studentForm.reset();
        closeModal("form-modal");
        updateTables();
    } catch (error) {
        showError("Не удалось сохранить студента. " + error.message);
    } finally {
        isUpdatingCookie = false;
        submitButton.disabled = false;
    }
});

if ("cookieStore" in window) {
    cookieStore.addEventListener("change", () => {
        if (!isUpdatingCookie) updateTables();
    });
}
