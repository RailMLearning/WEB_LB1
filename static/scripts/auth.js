let authTokens = null;
let authUser = null;
let refreshPromise = null;
let authVersion = 0;

function storeAuth(tokens) {
    authTokens = tokens;
    authUser = tokens?.user ?? null;
    if (tokens) sessionStorage.setItem("studentAuth", JSON.stringify(tokens));
    else sessionStorage.removeItem("studentAuth");
    renderAuth();
}

function renderAuth() {
    const signedIn = Boolean(authUser);
    document.getElementById("auth-panel").hidden = signedIn;
    document.getElementById("students-panel").hidden = !signedIn;
    document.getElementById("session-panel").hidden = !signedIn;
    document.getElementById("current-user").textContent = signedIn ? `${authUser.username} · ${authUser.role}` : "";
    document.getElementById("btn-add").hidden = authUser?.role !== "ADMIN";
    if (!signedIn) {
        tableRequest += 1;
        selectionRequest += 1;
        studentDetailsRequest += 1;
        document.getElementById("students-tbody").replaceChildren();
        for (const id of ["form-modal", "confirm-modal", "more-info-modal"]) closeModal(id);
    }
}

async function refreshAuth() {
    if (!refreshPromise || refreshPromise.version !== authVersion) {
        const version = authVersion;
        const token = authTokens?.refreshToken;
        const pending = (async () => {
            if (!token) throw new Error("Войдите в систему.");
            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: token })
            });
            const tokens = await readStudentResponse(response);
            if (version !== authVersion) throw new Error("Сеанс завершён.");
            storeAuth(tokens);
        })().catch(error => {
            if (version === authVersion) {
                authVersion += 1;
                storeAuth(null);
                document.getElementById("auth-error").textContent = "Сеанс истёк. Войдите снова.";
            }
            throw error;
        }).finally(() => { if (refreshPromise === pending) refreshPromise = null; });
        pending.version = version;
        refreshPromise = pending;
    }
    return refreshPromise;
}

async function authorizedFetch(url, options = {}) {
    if (!authTokens) throw new Error("Войдите в систему.");
    const version = authVersion;
    const accessToken = authTokens.accessToken;
    const send = () => fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${authTokens.accessToken}` } });
    let response = await send();
    if (version !== authVersion) throw new Error("Сеанс изменён.");
    if (response.status === 401) {
        if (authTokens.accessToken === accessToken) await refreshAuth();
        if (version !== authVersion) throw new Error("Сеанс изменён.");
        response = await send();
    }
    if (version !== authVersion) throw new Error("Сеанс изменён.");
    if (response.status === 401) {
        authVersion += 1;
        storeAuth(null);
    }
    return response;
}

async function initializeAuth() {
    try {
        const saved = JSON.parse(sessionStorage.getItem("studentAuth"));
        if (saved?.accessToken && saved?.refreshToken) authTokens = saved;
        if (authTokens) {
            const response = await authorizedFetch("/api/auth/me");
            authUser = await readStudentResponse(response);
            authTokens.user = authUser;
            storeAuth(authTokens);
            await updateTables();
        } else renderAuth();
    } catch {
        authVersion += 1;
        storeAuth(null);
    }
}

const authForm = document.getElementById("auth-form");
const registerToggle = document.getElementById("register-mode");
registerToggle.addEventListener("change", () => {
    document.getElementById("email-label").hidden = !registerToggle.checked;
    authForm.elements.email.required = registerToggle.checked;
    document.getElementById("auth-submit").textContent = registerToggle.checked ? "Зарегистрироваться" : "Войти";
});

authForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("auth-submit");
    if (button.disabled) return;
    const errorPanel = document.getElementById("auth-error");
    errorPanel.textContent = "";
    button.disabled = true;
    const username = authForm.elements.username.value.trim();
    const password = authForm.elements.password.value;
    const data = { username, password };
    const registering = registerToggle.checked;
    try {
        if (registering) {
            const response = await fetch("/api/auth/register", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, email: authForm.elements.email.value.trim() })
            });
            await readStudentResponse(response);
        }
        const response = await fetch("/api/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
        });
        const tokens = await readStudentResponse(response);
        authVersion += 1;
        storeAuth(tokens);
        authForm.reset();
        registerToggle.dispatchEvent(new Event("change"));
        studentPage = 0;
        await updateTables();
    } catch (error) { errorPanel.textContent = error.message; }
    finally { button.disabled = false; }
});

document.getElementById("logout-button").addEventListener("click", async () => {
    const refreshToken = authTokens?.refreshToken;
    authVersion += 1;
    storeAuth(null);
    if (!refreshToken) return;
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken })
        });
        await readStudentResponse(response);
    } catch { document.getElementById("auth-error").textContent = "Вы вышли локально. Сервер не подтвердил отзыв сеанса."; }
});
