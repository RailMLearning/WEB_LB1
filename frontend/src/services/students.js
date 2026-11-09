import { useAuthStore } from "../stores/auth.js";

export async function listStudents(query, signal) {
    const fields = Object.entries(query).filter(([, value]) => value !== "");
    const filters = fields.filter(([key]) => !["page", "size", "sort", "order"].includes(key));
    const options = filters.length > 3
        ? { method: "QUERY", json: Object.fromEntries(fields), signal }
        : { signal };
    const path = filters.length > 3
        ? "/requests"
        : `/requests?${new URLSearchParams(fields)}`;
    const { data, headers } = await useAuthStore().request(path, options);
    if (!Array.isArray(data)) throw new Error("Сервер вернул список в неверном формате.");
    return { items: data, total: Number(headers.get("X-Total-Count") || data.length) };
}

export async function getStudent(isu, signal) {
    const { data } = await useAuthStore().request(`/requests/${encodeURIComponent(isu)}`, { signal });
    return data;
}

export async function saveStudent(student, originalIsu = null) {
    const path = originalIsu === null
        ? "/requests"
        : `/requests/${encodeURIComponent(originalIsu)}`;
    const { data } = await useAuthStore().request(path, {
        method: originalIsu === null ? "POST" : "PATCH", json: student
    });
    return data;
}

export function deleteStudent(isu) {
    return useAuthStore().request(`/requests/${encodeURIComponent(isu)}`, { method: "DELETE" });
}
