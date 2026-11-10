import test from "node:test";
import assert from "node:assert/strict";
import {
    emptyStudent,
    validateAuth,
    validateStudent
} from "../../frontend/src/services/validation.js";
import { safeRedirect } from "../../frontend/src/router.js";

function student() {
    return {
        ...emptyStudent(),
        isu: "001234",
        fio: "Анна",
        grid: "M3301",
        dnum: "8",
        rnum: "42",
        expdate: "2026-10-20"
    };
}

test("one-word names, leading-zero IDs and false are valid", () => {
    const value = student();
    assert.deepEqual(validateStudent(value), {});
    assert.equal(value.isu, "001234");
    assert.equal(value.foreigner, false);
});

test("invalid dates, numeric names and unsafe room numbers are rejected", () => {
    const errors = validateStudent({
        ...student(),
        fio: "Анна2",
        expdate: "2026-02-30",
        dnum: "0",
        rnum: "9007199254740992",
        grid: "m3301"
    });
    assert.deepEqual(Object.keys(errors).sort(), ["dnum", "expdate", "fio", "grid", "rnum"]);
});

test("authentication validates bytes, username and email", () => {
    const errors = validateAuth({ username: "я", email: "wrong", password: "я".repeat(37) }, true);
    assert.deepEqual(Object.keys(errors).sort(), ["email", "password", "username"]);
    assert.deepEqual(validateAuth({ username: "student_1", password: "Password1!" }), {});
});

test("redirects cannot leave the application or loop through login", () => {
    for (const value of ["https://evil.test", "//evil.test", "/\\evil.test", "/login?x=1"]) {
        assert.equal(safeRedirect(value), "/students");
    }
    assert.equal(safeRedirect("/students/001234"), "/students/001234");
});
