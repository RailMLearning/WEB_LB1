import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ApiError, createApiClient } from "../services/api.js";

const storageKey = "studentAuth";

function readSession() {
    try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey));
        return saved?.accessToken && saved?.refreshToken ? saved : null;
    } catch {
        return null;
    }
}

export const useAuthStore = defineStore("auth", () => {
    const tokens = ref(readSession());
    const user = ref(tokens.value?.user || null);
    const notice = ref("");
    const initializationError = ref("");
    const initialized = ref(false);
    let version = 0;
    let loginAttempt = 0;
    let initializing = null;
    const isAuthenticated = computed(() => Boolean(tokens.value && user.value));
    const isAdmin = computed(() => user.value?.role === "ADMIN");

    function persist(next) {
        tokens.value = next;
        user.value = next?.user || null;
        try {
            if (next) sessionStorage.setItem(storageKey, JSON.stringify(next));
            else sessionStorage.removeItem(storageKey);
        } catch {
            notice.value = "Браузер запретил сохранение сеанса. После обновления потребуется вход.";
        }
    }

    const client = createApiClient({
        getSession: () => ({ tokens: tokens.value, version }),
        updateTokens: persist,
        expireSession: () => {
            version += 1;
            persist(null);
            notice.value = "Сеанс истёк. Войдите снова.";
        }
    });

    async function loadProfile() {
        const { data } = await client.request("/auth/me");
        persist({ ...tokens.value, user: data });
        initializationError.value = "";
        return data;
    }

    async function initialize() {
        if (initialized.value) return;
        if (!initializing) {
            initializing = (async () => {
                if (tokens.value) {
                    try {
                        await loadProfile();
                    } catch (error) {
                        initializationError.value = error.message;
                    }
                }
                initialized.value = true;
            })();
        }
        return initializing;
    }

    async function login(data) {
        const attempt = ++loginAttempt;
        const result = await client.publicRequest("/auth/login", { method: "POST", json: data });
        if (attempt !== loginAttempt) throw new ApiError(401, "Запрос входа отменён.");
        version += 1;
        persist(result.data);
        notice.value = "";
        initializationError.value = "";
        initialized.value = true;
    }

    async function register(data) {
        await client.publicRequest("/auth/register", { method: "POST", json: data });
        await login({ username: data.username, password: data.password });
    }

    async function logout() {
        const refreshToken = tokens.value?.refreshToken;
        loginAttempt += 1;
        version += 1;
        persist(null);
        notice.value = "";
        if (!refreshToken) return;
        try {
            await client.publicRequest("/auth/logout", {
                method: "POST", json: { refreshToken }
            });
        } catch {
            notice.value = "Вы вышли на этом устройстве. Сервер не подтвердил отзыв сеанса.";
        }
    }

    return {
        user, notice, initializationError, initialized, isAuthenticated, isAdmin,
        initialize, loadProfile, login, register, logout, request: client.request
    };
});
