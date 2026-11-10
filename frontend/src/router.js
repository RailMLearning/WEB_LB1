import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth.js";

export function safeRedirect(value) {
    return typeof value === "string" &&
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.includes("\\") &&
        !/^\/(login|register)(?:[/?#]|$)/.test(value)
        ? value
        : "/students";
}

export function createAppRouter(pinia) {
    const router = createRouter({
        history: createWebHistory(),
        scrollBehavior: () => ({ top: 0 }),
        routes: [
            { path: "/", redirect: "/students" },
            {
                path: "/login",
                name: "login",
                component: () => import("./views/AuthView.vue"),
                props: { registering: false },
                meta: { guestOnly: true, title: "Вход" }
            },
            {
                path: "/register",
                name: "register",
                component: () => import("./views/AuthView.vue"),
                props: { registering: true },
                meta: { guestOnly: true, title: "Регистрация" }
            },
            {
                path: "/students",
                name: "students",
                component: () => import("./views/StudentsView.vue"),
                meta: { requiresAuth: true, title: "Студенты" }
            },
            {
                path: "/students/new",
                name: "student-create",
                component: () => import("./views/StudentEditView.vue"),
                meta: { requiresAuth: true, adminOnly: true, title: "Новый студент" }
            },
            {
                path: "/students/:isu/edit",
                name: "student-edit",
                props: true,
                component: () => import("./views/StudentEditView.vue"),
                meta: { requiresAuth: true, adminOnly: true, title: "Редактирование" }
            },
            {
                path: "/students/:isu",
                name: "student-details",
                props: true,
                component: () => import("./views/StudentDetailsView.vue"),
                meta: { requiresAuth: true, title: "Карточка студента" }
            },
            {
                path: "/profile",
                name: "profile",
                component: () => import("./views/ProfileView.vue"),
                meta: { requiresAuth: true, title: "Мой профиль" }
            },
            {
                path: "/docs",
                name: "docs",
                component: () => import("./views/DocsView.vue"),
                meta: { title: "API" }
            },
            {
                path: "/forbidden",
                component: () => import("./views/NotFoundView.vue"),
                props: { forbidden: true },
                meta: { title: "Нет доступа" }
            },
            {
                path: "/:pathMatch(.*)*",
                component: () => import("./views/NotFoundView.vue"),
                meta: { title: "Страница не найдена" }
            }
        ]
    });
    router.beforeEach(async to => {
        const auth = useAuthStore(pinia);
        await auth.initialize();
        if (to.meta.requiresAuth && !auth.isAuthenticated) {
            return { name: "login", query: { redirect: to.fullPath } };
        }
        if (to.meta.adminOnly && !auth.isAdmin) return "/forbidden";
        if (to.meta.guestOnly && auth.isAuthenticated) return safeRedirect(to.query.redirect);
    });
    router.afterEach(to => {
        document.title = `${to.meta.title || "Студенты"} — Общежитие`;
    });
    return router;
}
