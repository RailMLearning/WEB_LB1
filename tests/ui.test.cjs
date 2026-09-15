const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function setup() {
    const nodes = {};
    const actions = [];
    const records = new Map();
    function node() {
        return { value: "", checked: false, disabled: false, dataset: {}, textContent: "", handlers: {},
            addEventListener(name, handler) { this.handlers[name] = handler; },
            setCustomValidity(message) { this.error = message; }, reportValidity() {}
        };
    }
    const fields = ["isu", "fio", "grid", "dnum", "rnum", "expdate", "foreigner", "notes"];
    const inputs = Object.fromEntries(fields.map(field => [field, node()]));
    const elements = Object.values(inputs);
    elements.namedItem = name => inputs[name];
    const form = nodes.studform = node();
    form.elements = elements;
    form.reset = () => { for (const input of elements) { input.value = ""; input.checked = false; } };
    const cancel = node();
    cancel.dataset.close = "confirm-modal";
    const c = vm.createContext({
        studentFields: fields,
        document: {
            getElementById: id => nodes[id] ??= node(),
            querySelectorAll: selector => selector === "[data-close]" ? [cancel] : [nodes["confirm-delete"], cancel]
        },
        hideError() {}, showError: message => actions.push(["error", message]),
        openModal: id => actions.push(["open", id]), closeModal: id => actions.push(["close", id]),
        formatStudentForeign: value => value === "on" || value === "true" || value === true ? "Да" : "Нет",
        getStudentById: async id => records.get(id),
        showStudentDetailsById: id => actions.push(["details", id]),
        getStudentFormData: () => Object.fromEntries(fields.map(field => [field, field === "foreigner" ? String(inputs[field].checked) : inputs[field].value])),
        validateStudent: () => null,
        showStudentFormError: (form, error) => actions.push(["field-error", error.field]),
        saveStudent: async (data, original) => actions.push(["save", data, original]),
        deleteStudentById: async id => actions.push(["delete", id]),
        updateTables: async () => actions.push(["refresh"])
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../scripts/eventHandlers.js"), "utf8"), c);
    function click(action, isu) {
        return nodes["table-students"].handlers.click({ target: { closest: () => ({ dataset: { action, isu } }) } });
    }
    return { c, nodes, actions, records, inputs, form, cancel, click };
}

test("edit prefills every field, saves original ID, add clears previous state", async () => {
    const s = setup();
    s.records.set("12345", { isu: "12345", fio: "Петров Пётр", grid: "P3100", dnum: "3", rnum: "402", expdate: "2028-02-29", foreigner: "true", notes: "Заметка" });
    await s.click("edit", "12345");
    assert.equal(s.inputs.isu.value, "12345");
    assert.equal(s.inputs.notes.value, "Заметка");
    assert.equal(s.inputs.foreigner.checked, true);
    s.inputs.isu.value = "54321";
    await s.form.handlers.submit({ preventDefault() {} });
    const save = s.actions.find(action => action[0] === "save");
    assert.equal(save[1].isu, "54321");
    assert.equal(save[2], "12345");
    s.nodes["btn-add"].handlers.click();
    assert.equal(s.inputs.isu.value, "");
    assert.equal(s.inputs.notes.value, "");
    assert.equal(s.inputs.foreigner.checked, false);
});

test("delete confirmation and cancellation target the selected student", async () => {
    const s = setup();
    s.records.set("12345", { isu: "12345", fio: "Петров" });
    await s.click("delete", "12345");
    assert.match(s.nodes["delete-description"].textContent, /12345/);
    s.cancel.handlers.click();
    assert.equal(s.actions.some(action => action[0] === "delete"), false);
    await s.click("delete", "12345");
    await s.nodes["confirm-delete"].handlers.click();
    assert.equal(s.actions.find(action => action[0] === "delete")[1], "12345");
});

test("save failure preserves input, restores controls and displays error", async () => {
    const s = setup();
    s.inputs.fio.value = "Петров Пётр";
    s.c.saveStudent = async () => { const error = new Error("duplicate"); error.field = "isu"; throw error; };
    await s.form.handlers.submit({ preventDefault() {} });
    assert.equal(s.inputs.fio.value, "Петров Пётр");
    assert.equal(s.inputs.fio.disabled, false);
    assert.equal(s.actions.some(action => action[0] === "field-error"), true);
    assert.equal(s.actions.some(action => action[0] === "close"), false);
});

test("latest selection wins while student lookup is pending", async () => {
    const s = setup();
    let resolve;
    s.c.getStudentById = () => new Promise(done => { resolve = done; });
    const pending = s.click("edit", "12345");
    s.nodes["btn-add"].handlers.click();
    resolve({ isu: "12345", fio: "Старый запрос" });
    await pending;
    assert.equal(s.inputs.isu.value, "");
});

test("real validation runs on submit and shows an error below the form for numeric FIO", async () => {
    const s = setup();
    s.c.FormData = class {
        constructor() {
            return Object.entries(s.inputs).map(([name, input]) => [name, input.value]);
        }
    };
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../scripts/validation.js"), "utf8"), s.c);
    s.c.showError = message => { s.nodes.error ??= { textContent: "" }; s.nodes.error.textContent = message; };
    s.c.hideError = () => s.c.showError("");
    const data = { isu: "123456", fio: "Петров 123", grid: "P3100", dnum: "3", rnum: "402", expdate: "2028-02-29", notes: "" };
    for (const [field, value] of Object.entries(data)) s.inputs[field].value = value;
    await s.form.handlers.submit({ preventDefault() {} });
    assert.equal(s.actions.some(action => action[0] === "save"), false);
    assert.match(s.inputs.fio.error, /фамилию и имя/);
    assert.match(s.nodes.error.textContent, /фамилию и имя/);
    s.inputs.fio.value = "Петров Пётр";
    s.form.handlers.input({ target: s.inputs.fio });
    await s.form.handlers.submit({ preventDefault() {} });
    assert.equal(s.actions.some(action => action[0] === "save"), true);
});

test("native invalid fields show the first error below the form before submit", () => {
    const s = setup();
    s.inputs.isu.validity = { valid: false };
    s.inputs.isu.labels = [{ textContent: "ИСУ ID" }];
    s.inputs.isu.validationMessage = "Заполните это поле.";
    s.inputs.fio.validity = { valid: false };
    s.inputs.fio.labels = [{ textContent: "ФИО" }];
    s.inputs.fio.validationMessage = "Заполните это поле.";
    s.form.handlers.invalid({ target: s.inputs.isu });
    s.form.handlers.invalid({ target: s.inputs.fio });
    const errors = s.actions.filter(action => action[0] === "error");
    assert.equal(errors.length, 1);
    assert.equal(errors[0][1], "ИСУ ID: Заполните это поле.");
    assert.equal(s.actions.some(action => action[0] === "save"), false);
});
