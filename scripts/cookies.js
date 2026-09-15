const studentFields = ["isu", "fio", "grid", "dnum", "rnum", "expdate", "foreigner", "notes"];

function requireCookieStore() {
    if (!("cookieStore" in window)) {
        throw new Error("Откройте сайт через localhost или HTTPS в браузере с поддержкой Cookie Store API.");
    }
    return window.cookieStore;
}

function studentRecords(cookies) {
    const records = [];
    for (const cookie of cookies.filter(item => item.name.startsWith("student_"))) {
        let student;
        try {
            student = JSON.parse(decodeURIComponent(cookie.value));
        } catch {
            throw new Error("Не удалось прочитать сохранённую запись " + cookie.name);
        }
        if (!student || !validateId(student.isu)) throw new Error("Повреждена запись " + cookie.name);
        records.push({ key: cookie.name, student });
    }
    for (const marker of cookies.filter(item => /^isu_isu\d{5,7}$/.test(item.name))) {
        const isu = marker.name.slice(7);
        if (records.some(record => record.student.isu === isu)) continue;
        const student = {};
        for (const field of [...studentFields, "foreign"]) {
            const cookie = cookies.find(item => item.name === `${field}_isu${isu}`);
            if (cookie) student[field] = cookie.value;
        }
        if (student.isu === isu) records.push({ key: null, student });
    }
    return records;
}

async function getAllStudents() {
    const records = studentRecords(await requireCookieStore().getAll());
    return records.map(record => record.student).sort((a, b) => a.isu.localeCompare(b.isu));
}

async function getStudentById(isu) {
    return (await getAllStudents()).find(student => student.isu === String(isu)) ?? null;
}

function legacyCookies(cookies, isu) {
    return cookies.filter(cookie => [...studentFields, "foreign"].some(field => cookie.name === `${field}_isu${isu}`));
}

async function changeStudentCookies(operations, snapshot) {
    const storage = requireCookieStore();
    const changed = [];
    try {
        for (const operation of operations) {
            changed.push(operation.name);
            if (operation.value === null) {
                await storage.delete({ name: operation.name, path: "/" });
            } else {
                await storage.set({ ...operation, path: "/", expires: Date.now() + 86400000, sameSite: "lax" });
            }
            const saved = await storage.get(operation.name);
            if (operation.value === null ? saved !== undefined && saved !== null : saved?.value !== operation.value) {
                throw new Error("Браузер не подтвердил сохранение данных.");
            }
        }
    } catch (error) {
        let restored = true;
        for (const name of changed.reverse()) {
            const previous = snapshot.find(cookie => cookie.name === name);
            try {
                if (previous) {
                    await storage.set({ name, value: previous.value, path: "/", expires: previous.expires ?? Date.now() + 86400000, sameSite: "lax" });
                } else {
                    await storage.delete({ name, path: "/" });
                }
            } catch {
                restored = false;
            }
        }
        throw new Error(error.message + (restored ? " Прежние данные восстановлены." : " Не удалось полностью восстановить данные. Проверьте список студентов."));
    }
}

async function saveStudent(student, originalIsu = null) {
    const validation = validateStudent(student);
    if (validation) throw new Error(validation.message);
    const snapshot = await requireCookieStore().getAll();
    const records = studentRecords(snapshot);
    const original = originalIsu === null ? null : records.find(record => record.student.isu === originalIsu);
    if (originalIsu !== null && !original) throw new Error("Студент уже удалён. Обновите список.");
    if (records.some(record => record.student.isu === student.isu && record !== original)) {
        const error = new Error("Студент с таким ИСУ уже существует.");
        error.field = "isu";
        throw error;
    }
    const value = encodeURIComponent(JSON.stringify(student));
    const key = original?.key ?? `student_${crypto.randomUUID()}`;
    if (key.length + value.length > 3800) {
        const error = new Error("Запись слишком велика для cookies. Сократите заметки или ФИО.");
        error.field = "notes";
        throw error;
    }
    const operations = [{ name: key, value }];
    for (const cookie of legacyCookies(snapshot, originalIsu ?? student.isu)) {
        operations.push({ name: cookie.name, value: null });
    }
    await changeStudentCookies(operations, snapshot);
}

async function deleteStudentById(isu) {
    const snapshot = await requireCookieStore().getAll();
    const record = studentRecords(snapshot).find(item => item.student.isu === String(isu));
    if (!record) throw new Error("Студент уже удалён. Обновите список.");
    const names = legacyCookies(snapshot, String(isu)).map(cookie => cookie.name);
    if (record.key) names.push(record.key);
    await changeStudentCookies(names.map(name => ({ name, value: null })), snapshot);
}
