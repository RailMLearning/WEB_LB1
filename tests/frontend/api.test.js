import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";
import { createApiClient } from "../../frontend/src/services/api.js";

function setup() {
    let session = { version: 1, tokens: { accessToken: "old", refreshToken: "refresh" } };
    let expired = 0;
    const client = createApiClient({
        getSession: () => session,
        updateTokens: tokens => { session = { ...session, tokens }; },
        expireSession: () => { expired += 1; session = { version: 2, tokens: null }; }
    });
    return {
        client, session: () => session, expired: () => expired,
        replace: next => { session = next; }
    };
}

const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" }
});

test("concurrent 401 responses use one refresh and retry with the new token", async t => {
    const state = setup();
    let refreshes = 0;
    t.mock.method(globalThis, "fetch", async (url, options) => {
        if (url.endsWith("/auth/refresh")) {
            refreshes += 1;
            await pause(15);
            return json({ accessToken: "new", refreshToken: "rotated", user: { role: "USER" } });
        }
        return options.headers.get("Authorization") === "Bearer new" ? json([]) : json({}, 401);
    });
    const results = await Promise.all([
        state.client.request("/requests"), state.client.request("/requests"),
        state.client.request("/auth/me")
    ]);
    assert.equal(refreshes, 1);
    assert.equal(results.length, 3);
    assert.equal(state.session().tokens.refreshToken, "rotated");
});

test("a refresh from an old session cannot overwrite a newer login", async t => {
    const state = setup();
    let finish;
    t.mock.method(globalThis, "fetch", async url => {
        if (url.endsWith("/auth/refresh")) {
            await new Promise(resolve => { finish = resolve; });
            return json({ accessToken: "stale", refreshToken: "stale-refresh" });
        }
        return json({}, 401);
    });
    const pending = state.client.request("/requests");
    await pause(15);
    state.replace({ version: 2, tokens: { accessToken: "other-user", refreshToken: "other" } });
    finish();
    await assert.rejects(pending, error => error.status === 401);
    assert.equal(state.session().tokens.accessToken, "other-user");
    assert.equal(state.expired(), 0);
});

test("403 is returned without trying to refresh", async t => {
    const state = setup();
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => { calls += 1; return json({}, 403); });
    await assert.rejects(state.client.request("/requests", { method: "POST" }), {
        status: 403, message: "У вас нет прав для этого действия."
    });
    assert.equal(calls, 1);
    assert.equal(state.expired(), 0);
});

test("rejected refresh expires the session", async t => {
    const state = setup();
    t.mock.method(globalThis, "fetch", async () => json({}, 401));
    await assert.rejects(state.client.request("/requests"), error => error.status === 401);
    assert.equal(state.expired(), 1);
});

test("backend field errors and empty 204 responses preserve their meaning", async t => {
    const state = setup();
    t.mock.method(globalThis, "fetch", async (url, options) => {
        if (options.method === "DELETE") return new Response(null, { status: 204 });
        return json({ detail: [{ field: "fio", message: "Только буквы." }] }, 422);
    });
    await assert.rejects(state.client.request("/requests", { method: "POST" }), error => {
        assert.equal(error.details[0].field, "fio");
        return error.status === 422 && error.message === "Только буквы.";
    });
    assert.equal((await state.client.request("/requests/001234", { method: "DELETE" })).data, null);
});

test("network failures have a readable message without ending the session", async t => {
    const state = setup();
    t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
    await assert.rejects(state.client.request("/requests"), error => {
        return error.status === 0 && error.message.includes("Не удалось связаться");
    });
    assert.equal(state.expired(), 0);
});

test("external cancellation aborts the actual fetch", async t => {
    const state = setup();
    let aborted = false;
    t.mock.method(globalThis, "fetch", (url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener("abort", () => {
            aborted = true;
            reject(new DOMException("Aborted", "AbortError"));
        });
    }));
    const controller = new AbortController();
    const pending = state.client.request("/requests", { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(aborted, true);
});
