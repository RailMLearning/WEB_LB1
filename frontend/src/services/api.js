export class ApiError extends Error {
    constructor(status, message, details = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

async function fetchJson(path, options = {}) {
    const { json, signal, ...init } = options;
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 20000);
    try {
        const headers = new Headers(init.headers);
        if (json !== undefined) headers.set("Content-Type", "application/json");
        const response = await fetch(`/api${path}`, {
            ...init,
            headers,
            body: json === undefined ? undefined : JSON.stringify(json),
            signal: controller.signal
        });
        let data = null;
        if (response.status !== 204) {
            try {
                data = await response.json();
            } catch {
                throw new ApiError(response.status, "Сервер вернул некорректный ответ.");
            }
        }
        if (!response.ok) {
            const details = Array.isArray(data?.detail) ? data.detail : [];
            const messages = details.map(item => item.message || item.msg).filter(Boolean);
            const fallback = {
                401: "Войдите в систему снова.",
                403: "У вас нет прав для этого действия.",
                404: "Запись не найдена.",
                409: "Запись с такими данными уже существует.",
                422: "Проверьте заполненные поля."
            };
            const message = messages.join(" ") || fallback[response.status] ||
                "Ошибка сервера. Повторите запрос позже.";
            throw new ApiError(response.status, message, details);
        }
        return { data, headers: response.headers, status: response.status };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (signal?.aborted) throw new DOMException("Запрос отменён.", "AbortError");
        const message = controller.signal.aborted
            ? "Сервер долго не отвечает. Попробуйте ещё раз."
            : "Не удалось связаться с сервером. Проверьте подключение и повторите запрос.";
        throw new ApiError(0, message);
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
    }
}

export function createApiClient({ getSession, updateTokens, expireSession }) {
    let refreshing = null;

    function checkSession(version) {
        if (getSession().version !== version) {
            throw new ApiError(401, "Сеанс изменён. Повторите действие после входа.");
        }
    }

    async function refresh(version) {
        if (!refreshing || refreshing.version !== version) {
            const refreshToken = getSession().tokens?.refreshToken;
            const pending = fetchJson("/auth/refresh", {
                method: "POST",
                json: { refreshToken }
            }).then(result => {
                checkSession(version);
                updateTokens(result.data);
            }).catch(error => {
                if (getSession().version === version && error.status === 401) {
                    expireSession();
                }
                throw error;
            }).finally(() => {
                if (refreshing === pending) refreshing = null;
            });
            pending.version = version;
            refreshing = pending;
        }
        return refreshing;
    }

    async function request(path, options = {}) {
        const { tokens, version } = getSession();
        if (!tokens?.accessToken) throw new ApiError(401, "Войдите в систему.");
        const send = () => {
            const headers = new Headers(options.headers);
            headers.set("Authorization", `Bearer ${getSession().tokens?.accessToken}`);
            return fetchJson(path, { ...options, headers });
        };
        try {
            const result = await send();
            checkSession(version);
            return result;
        } catch (error) {
            checkSession(version);
            if (error.status !== 401) throw error;
        }
        if (getSession().tokens.accessToken === tokens.accessToken) await refresh(version);
        checkSession(version);
        try {
            const result = await send();
            checkSession(version);
            return result;
        } catch (error) {
            if (getSession().version === version && error.status === 401) expireSession();
            throw error;
        }
    }

    return { request, publicRequest: fetchJson };
}
