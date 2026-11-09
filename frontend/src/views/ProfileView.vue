<script setup>
import { onMounted, ref } from "vue";
import { useAuthStore } from "../stores/auth.js";
import PageHeading from "../components/PageHeading.vue";
import AppNotice from "../components/AppNotice.vue";
import LoadingState from "../components/LoadingState.vue";

const auth = useAuthStore();
const loading = ref(true);
const error = ref("");
async function load() {
    loading.value = true;
    error.value = "";
    try { await auth.loadProfile(); }
    catch (reason) { error.value = reason.message; }
    finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
    <PageHeading title="Мой профиль" description="Данные аккаунта и доступные действия." />
    <LoadingState v-if="loading" label="Загружаем профиль…" />
    <section v-else class="content-panel profile-panel">
        <AppNotice v-if="error" kind="error">{{ error }}</AppNotice>
        <template v-if="auth.user">
            <div class="profile-title"><span class="avatar avatar-large">{{ auth.user.username.slice(0, 2).toUpperCase() }}</span>
                <div><h2>{{ auth.user.username }}</h2>
                    <p class="muted">{{ auth.isAdmin ? "Администратор" : "Пользователь" }}</p>
                </div>
            </div>
            <dl class="details-grid">
                <div><dt>Идентификатор</dt><dd>{{ auth.user.id }}</dd></div>
                <div><dt>Логин</dt><dd>{{ auth.user.username }}</dd></div>
                <div><dt>Электронная почта</dt><dd>{{ auth.user.email }}</dd></div>
                <div><dt>Роль</dt><dd>{{ auth.user.role }}</dd></div>
            </dl>
            <AppNotice>{{ auth.isAdmin
                ? "Вы можете просматривать, добавлять, изменять и удалять записи студентов."
                : "Вы можете просматривать список и карточки студентов. Изменение записей недоступно." }}</AppNotice>
        </template>
        <button class="button button-secondary" @click="load">Обновить данные</button>
    </section>
</template>
