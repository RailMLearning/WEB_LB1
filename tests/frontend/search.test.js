import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";
import { createStudentSearch } from "../../frontend/src/services/studentSearch.js";

test("switchMap cancels the previous request and ignores its delayed result", async () => {
    const calls = [];
    const states = [];
    const search = createStudentSearch((query, signal) => new Promise(resolve => {
        calls.push({ query, signal, resolve });
    }), { q: "first" }, 5);
    const subscription = search.results$.subscribe(value => states.push(value));
    await pause(25);
    search.setQuery({ q: "second" });
    await pause(25);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].signal.aborted, true);
    calls[0].resolve({ items: ["stale"], total: 1 });
    calls[1].resolve({ items: ["fresh"], total: 1 });
    await pause(10);
    assert.deepEqual(states.at(-1).items, ["fresh"]);
    assert.equal(states.some(state => state.items?.includes("stale")), false);
    subscription.unsubscribe();
    search.destroy();
});

test("debounce merges typing, distinct skips duplicates, reload repeats the request", async () => {
    let count = 0;
    const search = createStudentSearch(async () => {
        count += 1;
        return { items: [], total: 0 };
    }, { q: "" }, 5);
    const subscription = search.results$.subscribe();
    search.setQuery({ q: "a" });
    search.setQuery({ q: "anna" });
    await pause(25);
    assert.equal(count, 1);
    search.setQuery({ q: "anna" });
    await pause(25);
    assert.equal(count, 1);
    search.reload();
    await pause(10);
    assert.equal(count, 2);
    subscription.unsubscribe();
    search.destroy();
});

test("an error does not terminate search and unsubscription aborts pending work", async () => {
    let count = 0;
    let signal;
    const states = [];
    const search = createStudentSearch(async (query, currentSignal) => {
        signal = currentSignal;
        count += 1;
        if (count === 1) throw new Error("offline");
        return new Promise(() => {});
    }, { q: "" }, 5);
    const subscription = search.results$.subscribe(state => states.push(state));
    await pause(25);
    assert.equal(states.at(-1).error.message, "offline");
    search.reload();
    await pause(10);
    assert.equal(count, 2);
    assert.equal(signal.aborted, false);
    subscription.unsubscribe();
    assert.equal(signal.aborted, true);
    search.destroy();
});
