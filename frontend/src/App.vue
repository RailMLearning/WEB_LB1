<script setup>
import { computed, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth.js";
import { useStudentsStore } from "./stores/students.js";
import AppIcon from "./components/AppIcon.vue";
import AppNotice from "./components/AppNotice.vue";

const auth = useAuthStore();
const students = useStudentsStore();
const route = useRoute();
const router = useRouter();
const guestLayout = computed(() => Boolean(route.meta.guestOnly));
const initials = computed(() => auth.user?.username.slice(0, 2).toUpperCase() || "");

watch(() => auth.isAuthenticated, signedIn => {
    if (!signedIn) {
        students.reset();
        if (route.meta.requiresAuth) {
            router.replace({ name: "login", query: { redirect: route.fullPath } });
        }
    }
});

async function signOut() {
    await auth.logout();
    await router.replace("/login");
}
</script>

<template>
    <a class="skip-link" href="#main-content">К содержимому</a>
    <div v-if="guestLayout" class="guest-layout">
        <RouterView :key="route.path" />
    </div>
    <div v-else class="app-layout">
        <aside class="sidebar">
            <RouterLink to="/students" class="brand">
                <span class="brand-mark"><AppIcon name="building" /></span>
                <span>Общежитие<span class="brand-subtitle">Учёт студентов</span></span>
            </RouterLink>
            <nav aria-label="Главная навигация" class="navigation">
                <RouterLink to="/students" :class="{ active: route.path.startsWith('/students') }">
                    <AppIcon name="users" /> Студенты
                </RouterLink>
                <RouterLink v-if="auth.isAuthenticated" to="/profile">
                    <AppIcon name="user" /> Мой профиль
                </RouterLink>
                <RouterLink to="/docs"><AppIcon name="book" /> Документация API</RouterLink>
            </nav>
            <div class="sidebar-bottom">
                <template v-if="auth.isAuthenticated">
                    <span class="avatar">{{ initials }}</span>
                    <div class="account-name">
                        <strong>{{ auth.user.username }}</strong>
                        <span>{{ auth.isAdmin ? "Администратор" : "Пользователь" }}</span>
                    </div>
                    <button class="icon-button" aria-label="Выйти" @click="signOut">
                        <AppIcon name="logout" />
                    </button>
                </template>
                <RouterLink v-else class="button button-primary" to="/login">Войти</RouterLink>
            </div>
        </aside>
        <div class="workspace">
            <header class="topbar">
                <span>Студенческое общежитие</span>
                <span class="role-badge" v-if="auth.isAuthenticated">
                    {{ auth.isAdmin ? "Управление записями" : "Просмотр записей" }}
                </span>
            </header>
            <main id="main-content" class="main-content">
                <AppNotice v-if="auth.initializationError" kind="error">
                    {{ auth.initializationError }}
                </AppNotice>
                <RouterView :key="route.path" />
            </main>
        </div>
    </div>
</template>
