const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

function setup(initial = []) {
    const jar = new Map(initial.map(cookie => [cookie.name, { ...cookie }]));
    const storage = {
        getAll: async () => [...jar.values()],
        get: async name => jar.get(name),
        set: async cookie => { jar.set(cookie.name, { ...cookie }); },
        delete: async cookie => { jar.delete(typeof cookie === "string" ? cookie : cookie.name); }
    };
    const nodes = {};
    function element(tag = "div") {
        return { tag, children: [], dataset: {}, textContent: "", classList: { contains: () => true },
            appendChild(child) { this.children.push(child); },
            append(...children) { this.children.push(...children); },
            replaceChildren(...children) { this.children = children; }
        };
    }
    const context = vm.createContext({ crypto, window: { cookieStore: storage },
        document: { getElementById: id => nodes[id] ??= element(), createElement: element },
        openModal() {}
    });
    for (const file of ["validation.js", "cookies.js", "studentDetails.js", "utils.js"]) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, "../scripts", file), "utf8"), context);
    }
    return { context, jar, storage, nodes };
}
const student = (isu = "12345") => ({ isu, fio: "Петров Пётр", grid: "P3100", dnum: "3", rnum: "402", expdate: "2028-02-29", foreigner: "false", notes: "" });
const legacy = data => Object.entries(data).map(([field, value]) => ({ name: `${field}_isu${data.isu}`, value }));

test("create, read, reload, edit, change ID, reuse old ID and delete exact student", async () => {
    const { context: c, jar } = setup();
    await c.saveStudent(student());
    await c.saveStudent(student("123456"));
    assert.equal((await c.getAllStudents()).length, 2);
    await c.saveStudent({ ...student(), notes: "Изменено", foreigner: "true" }, "12345");
    assert.equal((await c.getStudentById("12345")).notes, "Изменено");
    await c.saveStudent({ ...student("54321"), notes: "Новый ИСУ" }, "12345");
    assert.equal(await c.getStudentById("12345"), null);
    await c.saveStudent(student("12345"));
    const reloaded = setup([...jar.values()]).context;
    assert.equal((await reloaded.getStudentById("54321")).notes, "Новый ИСУ");
    await c.deleteStudentById("12345");
    assert.equal(await c.getStudentById("12345"), null);
    assert.equal((await c.getStudentById("123456")).isu, "123456");
    assert.equal((await c.getAllStudents()).length, 2);
});

test("duplicate create and ID collision on edit preserve records", async () => {
    const { context: c } = setup();
    await c.saveStudent(student());
    await c.saveStudent(student("123456"));
    await assert.rejects(c.saveStudent(student()), /уже существует/);
    await assert.rejects(c.saveStudent(student("123456"), "12345"), /уже существует/);
    assert.equal((await c.getAllStudents()).length, 2);
});

test("legacy data is read exactly, migrated on edit, deleted without matching neighbours", async () => {
    const { context: c, jar } = setup([...legacy(student()), ...legacy(student("123456"))]);
    assert.equal((await c.getStudentById("12345")).isu, "12345");
    await c.saveStudent({ ...student(), notes: "Миграция" }, "12345");
    assert.equal(jar.has("isu_isu12345"), false);
    assert.equal(jar.has("isu_isu123456"), true);
    await c.deleteStudentById("123456");
    assert.equal((await c.getAllStudents()).length, 1);
    assert.equal((await c.getStudentById("12345")).notes, "Миграция");
});

test("failed migration restores exact previous values", async () => {
    const original = legacy(student());
    const { context: c, jar, storage } = setup(original);
    const remove = storage.delete;
    let failed = false;
    storage.delete = async cookie => {
        if (!failed) { failed = true; throw new Error("write failure"); }
        return remove(cookie);
    };
    await assert.rejects(c.saveStudent({ ...student(), notes: "Новое" }, "12345"), /восстановлены/);
    assert.equal(jar.size, original.length);
    for (const item of original) assert.equal(jar.get(item.name).value, item.value);
});

test("failed update and failed deletion preserve saved record", async () => {
    const { context: c, jar, storage } = setup();
    await c.saveStudent(student());
    const before = [...jar.values()][0].value;
    const set = storage.set;
    let failed = false;
    storage.set = async cookie => {
        if (!failed) { failed = true; throw new Error("write failure"); }
        return set(cookie);
    };
    await assert.rejects(c.saveStudent({ ...student(), notes: "Потеря" }, "12345"));
    assert.equal([...jar.values()][0].value, before);
    const remove = storage.delete;
    storage.delete = async cookie => { await remove(cookie); throw new Error("delete failure"); };
    await assert.rejects(c.deleteStudentById("12345"));
    assert.equal([...jar.values()][0].value, before);
});

test("oversized data is rejected before writing", async () => {
    const { context: c, jar } = setup();
    await assert.rejects(c.saveStudent({ ...student(), fio: "Я".repeat(74) + " " + "Я".repeat(75), notes: "Я".repeat(500) }), /слишком велика/);
    assert.equal(jar.size, 0);
});

test("corrupt and unavailable storage produce useful errors", async () => {
    const { context: c } = setup([{ name: "student_bad", value: "not-json" }]);
    await assert.rejects(c.getAllStudents(), /прочитать/);
    delete c.window.cookieStore;
    await assert.rejects(c.getAllStudents(), /localhost/);
});

test("validation handles names, dates, IDs and positive integers", () => {
    const { context: c } = setup();
    assert.equal(c.validateStudent(student()), null);
    for (const [field, value] of [["fio", " "], ["fio", "Иван 123"], ["isu", "1234"], ["isu", "12345x"], ["grid", "<b>"], ["dnum", "1.5"], ["rnum", "0"], ["rnum", "1e2"], ["expdate", "2027-02-29"], ["expdate", "0000-01-01"], ["notes", "a".repeat(501)]]) {
        assert.equal(c.validateStudent({ ...student(), [field]: value }).field, field);
    }
    assert.equal(c.validateStudent({ ...student(), fio: "Sean O’Connor" }), null);
});

test("overlapping table refreshes render only the latest snapshot", async () => {
    const { context: c, nodes } = setup();
    const pending = [];
    c.getAllStudents = () => new Promise(resolve => pending.push(resolve));
    const first = c.updateTables();
    const second = c.updateTables();
    pending[1]([student("123456")]);
    await second;
    pending[0]([student()]);
    await first;
    assert.equal(nodes["students-tbody"].children.length, 1);
    assert.equal(nodes["students-tbody"].children[0].children[3].textContent, "123456");
});

test("rendered values are text; dossier shows all fields and legacy foreign flag", () => {
    const { context: c, nodes } = setup();
    const row = c.createStudentRow({ ...student(), fio: "<b>Текст</b>" });
    assert.equal(row.children[1].textContent, "<b>Текст</b>");
    assert.equal(row.children[1].children.length, 0);
    c.showStudentDetails({ ...student(), foreigner: undefined, foreign: "on" });
    assert.equal(nodes["more-info"].children.length, 8);
    assert.equal(nodes["more-info"].children[6].children[1].textContent, "Да");
    c.showStudentDetails(null);
    assert.equal(nodes["more-info"].children.length, 0);
});
