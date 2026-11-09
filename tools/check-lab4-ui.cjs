const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env"), "utf8")
    .split(/\r?\n/).filter(line => line.includes("=") && !line.startsWith("#"))
    .map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
const base = process.env.LAB4_URL || "http://127.0.0.1:8080";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const output = path.join(root, "test-results");

function expiredToken(token) {
    const [header, payload] = token.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    claims.exp = Math.floor(Date.now() / 1000) - 10;
    const unsigned = `${header}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
    const signature = crypto.createHmac("sha256", env.JWT_SECRET).update(unsigned).digest("base64url");
    return `${unsigned}.${signature}`;
}

async function main() {
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.BROWSER_PATH || (fs.existsSync(edge) ? edge : undefined)
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    const cleanup = new Set();
    const suffix = Date.now().toString();
    const isu = "0" + crypto.randomInt(100000, 999999);
    const notes = `lab4-${suffix} <img src=x onerror=alert(1)>`;
    const fixture = {
        isu, fio: "Тестовый Студент", grid: "M3301", dnum: "8", rnum: "42",
        expdate: "2026-10-20", foreigner: true, notes
    };
    let adminAccess;
    let queryCount = 0;
    let refreshCount = 0;
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
        if (request.method() === "QUERY") queryCount += 1;
        if (request.url().endsWith("/api/auth/refresh")) refreshCount += 1;
    });
    const api = (method, endpoint, data) => context.request.fetch(base + "/api" + endpoint, {
        method, data, headers: adminAccess ? { Authorization: `Bearer ${adminAccess}` } : {}
    });
    async function waitList() {
        await page.getByText("Загружаем студентов…", { exact: true }).waitFor({ state: "hidden" });
    }
    async function search(value) {
        await page.getByRole("searchbox", { name: "Поиск студентов" }).fill(value);
        await page.waitForTimeout(450);
        await waitList();
    }
    fs.mkdirSync(output, { recursive: true });
    try {
        const login = await api("POST", "/auth/login", {
            username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD
        });
        assert.equal(login.status(), 200, "API administrator login");
        adminAccess = (await login.json()).accessToken;
        assert.equal((await api("GET", "/auth/me")).status(), 200, "current-user API");
        await page.goto(base + "/students");
        await page.waitForURL(/\/login/);
        await page.getByLabel("Логин", { exact: true }).fill(env.ADMIN_USERNAME);
        await page.getByLabel("Пароль", { exact: true }).fill("WrongPassword1!");
        await page.getByRole("button", { name: "Войти", exact: true }).click();
        await page.getByRole("alert").filter({ hasText: "Неверный логин или пароль" }).waitFor();
        await page.getByLabel("Пароль", { exact: true }).fill(env.ADMIN_PASSWORD);
        await page.getByRole("button", { name: "Войти", exact: true }).click();
        await page.waitForURL(/\/students$/);
        await waitList();
        await page.screenshot({ path: path.join(output, "lab4-desktop.png"), fullPage: true });
        console.log("OK protected route, invalid login, ADMIN login and student list");

        await page.getByRole("link", { name: "Добавить студента" }).click();
        for (const field of ["isu", "fio", "grid", "dnum", "rnum", "expdate", "notes"]) {
            await page.locator(`[name=${field}]`).fill(String(fixture[field]));
        }
        await page.locator("[name=foreigner]").check();
        await page.locator("[name=fio]").fill("Студент123");
        await page.getByRole("button", { name: "Сохранить", exact: true }).click();
        await page.getByText("Введите имя буквами.", { exact: false }).waitFor();
        await page.locator("[name=fio]").fill(fixture.fio);
        let creates = 0;
        const holdCreate = async route => {
            if (route.request().method() === "POST") {
                creates += 1;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            await route.continue();
        };
        await page.route("**/api/requests", holdCreate);
        cleanup.add(isu);
        await page.getByRole("button", { name: "Сохранить", exact: true }).evaluate(button => {
            button.click(); button.click();
        });
        await page.getByRole("button", { name: "Сохраняем…", exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Сохраняем…", exact: true }).isDisabled(), true);
        await page.waitForURL(base + "/students/" + isu);
        await page.getByRole("heading", { name: fixture.fio, exact: true }).waitFor();
        assert.equal(creates, 1);
        await page.unroute("**/api/requests", holdCreate);
        await page.getByText(notes, { exact: true }).waitFor();
        assert.equal(await page.locator(".notes-block img").count(), 0);
        await page.reload();
        await page.getByRole("heading", { name: fixture.fio, exact: true }).waitFor();
        console.log("OK validation, single submit, create, details, XSS text and direct-route reload");

        await page.getByRole("link", { name: "Изменить", exact: true }).click();
        await page.locator("[name=rnum]").fill("73");
        await page.getByRole("button", { name: "Сохранить", exact: true }).click();
        await page.waitForURL(base + "/students/" + isu);
        await page.locator("dd").getByText("73", { exact: true }).waitFor();
        await page.getByRole("navigation").getByRole("link", { name: "Студенты", exact: true }).click();
        await search(isu);
        await page.locator(`tr[data-isu="${isu}"]`).waitFor();
        await page.getByRole("button", { name: "Фильтры", exact: true }).click();
        for (const [name, value] of Object.entries({
            isu, fio: fixture.fio, grid: "M3301", dnum: "8", rnum: "73",
            expdate: fixture.expdate, notes: suffix
        })) await page.locator(`#advanced-filters [name=${name}]`).fill(value);
        await page.locator("#advanced-filters [name=foreigner]").selectOption("true");
        await page.waitForTimeout(450);
        await waitList();
        assert.ok(queryCount > 0, "more than three filters use QUERY");
        assert.equal(await page.locator("tbody tr").count(), 1);
        await page.getByLabel("Сортировать по", { exact: true }).selectOption("notes");
        await page.getByLabel("Порядок сортировки", { exact: true }).selectOption("desc");
        await page.waitForTimeout(450);
        await waitList();
        console.log("OK edit, all-field filtering, QUERY and sorting");

        const batchTag = `pages-${suffix}`;
        for (let i = 0; i < 12; i++) {
            const id = String(8000000 + crypto.randomInt(1000000));
            cleanup.add(id);
            const response = await api("POST", "/requests", { ...fixture, isu: id, notes: batchTag });
            assert.equal(response.status(), 201);
        }
        await page.getByRole("button", { name: "Сбросить", exact: true }).click();
        await search(batchTag);
        await page.getByLabel("На странице", { exact: true }).selectOption("10");
        await page.waitForTimeout(450);
        await waitList();
        assert.equal(await page.locator("tbody tr").count(), 10);
        await page.getByRole("button", { name: "Следующая страница" }).click();
        await page.waitForTimeout(450);
        await waitList();
        assert.equal(await page.locator("tbody tr").count(), 2);
        console.log("OK server pagination across two pages");

        await page.goto(base + "/students");
        await search(isu);
        await page.getByRole("button", { name: `Удалить: ${fixture.fio}`, exact: true }).click();
        await page.getByRole("dialog").waitFor();
        await page.keyboard.press("Escape");
        await page.getByRole("dialog").waitFor({ state: "detached" });
        await page.getByRole("button", { name: `Удалить: ${fixture.fio}`, exact: true }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Удалить", exact: true }).click();
        await page.getByRole("dialog").waitFor({ state: "detached" });
        await page.getByRole("heading", { name: "Студенты не найдены" }).waitFor();
        assert.equal((await api("GET", "/requests/" + isu)).status(), 404);
        await page.goto(base + "/profile");
        await page.getByText("Загружаем профиль…", { exact: true }).waitFor({ state: "hidden" });
        await page.getByText(env.ADMIN_EMAIL, { exact: true }).waitFor();
        assert.equal(await page.getByRole("alert").count(), 0);
        const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("studentAuth")));
        const expired = expiredToken(stored.accessToken);
        await page.evaluate(token => {
            const current = JSON.parse(sessionStorage.getItem("studentAuth"));
            current.accessToken = token;
            sessionStorage.setItem("studentAuth", JSON.stringify(current));
        }, expired);
        const before = refreshCount;
        await page.reload();
        await page.getByText("Загружаем профиль…", { exact: true }).waitFor({ state: "hidden" });
        await page.getByText(env.ADMIN_EMAIL, { exact: true }).waitFor();
        assert.equal(await page.getByRole("alert").count(), 0);
        assert.equal(refreshCount - before, 1);
        console.log("OK deletion confirmation, persistence, profile and real JWT refresh");

        await page.getByRole("button", { name: "Выйти", exact: true }).click();
        await page.waitForURL(/\/login/);
        assert.equal(await page.evaluate(() => sessionStorage.getItem("studentAuth")), null);
        await page.getByRole("link", { name: "Зарегистрироваться", exact: true }).click();
        const username = "vue" + suffix;
        await page.getByLabel("Логин", { exact: true }).fill(username);
        await page.getByLabel("Электронная почта", { exact: true }).fill(username + "@example.com");
        await page.getByLabel("Пароль", { exact: true }).fill("VueTestPassword1!");
        await page.getByRole("button", { name: "Создать аккаунт", exact: true }).click();
        await page.waitForURL(/\/students$/);
        await waitList();
        assert.equal(await page.getByRole("link", { name: "Добавить студента" }).count(), 0);
        assert.equal(await page.locator("button[aria-label^='Удалить:']").count(), 0);
        await page.goto(base + "/students/new");
        await page.waitForURL(/\/forbidden$/);
        await page.getByRole("heading", { name: "Недостаточно прав" }).waitFor();
        const user = await page.evaluate(() => JSON.parse(sessionStorage.getItem("studentAuth")));
        const denied = await context.request.post(base + "/api/requests", {
            data: fixture, headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        assert.equal(denied.status(), 403);
        await page.goto(base + "/students/" + isu);
        await page.getByRole("alert").getByText("Студент с таким ИСУ не найден.").waitFor();
        console.log("OK logout, registration, USER controls, route guard, backend 403 and missing student");

        const offline = route => route.abort("failed");
        await page.route("**/api/requests?*", offline);
        await page.goto(base + "/students");
        await page.getByRole("alert").filter({ hasText: "Не удалось связаться с сервером" }).waitFor();
        await page.unroute("**/api/requests?*", offline);
        await page.getByRole("button", { name: "Повторить запрос" }).click();
        await waitList();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(output, "lab4-mobile.png"), fullPage: true });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.goto(base + "/does-not-exist");
        await page.getByRole("heading", { name: "Страница не найдена" }).waitFor();
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(base + "/docs");
        await page.locator(".swagger-ui .info .title").waitFor();
        assert.deepEqual(errors, []);
        console.log("OK network error and retry, mobile layout, 404 page and Swagger");
        console.log(`PASSED Vue browser checks. Test USER remains: ${username}`);
    } finally {
        if (adminAccess) {
            for (const id of cleanup) await api("DELETE", "/requests/" + id);
        }
        await browser.close();
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
