<script setup>
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { safeRedirect } from "../router.js";
import { fieldErrors } from "../services/validation.js";
import AppIcon from "../components/AppIcon.vue";
import AppNotice from "../components/AppNotice.vue";
import AuthForm from "../components/AuthForm.vue";

const props = defineProps({ registering: Boolean });
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const busy = ref(false);
const message = ref("");
const errors = ref({});

async function submit(data) {
    if (busy.value) return;
    busy.value = true;
    message.value = "";
    errors.value = {};
    try {
        if (props.registering) await auth.register(data);
        else await auth.login(data);
        await router.replace(safeRedirect(route.query.redirect));
    } catch (error) {
        message.value = error.message;
        errors.value = fieldErrors(error);
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <main
        id="main-content"
        class="auth-page"
    >
        <section class="auth-intro">
            <RouterLink
                to="/"
                class="brand"
            >
                <span class="brand-mark"><AppIcon name="building" /></span>
                <span>Общежитие</span>
            </RouterLink>
            <div class="auth-intro-copy">
                <div
                    class="building-drawing"
                    aria-hidden="true"
                >
                    <div
                        v-for="floor in 5"
                        :key="floor"
                        class="drawing-floor"
                    >
                        <i
                            v-for="room in 5"
                            :key="room"
                        ></i>
                    </div>
                </div>
                <h2>У каждого студента<br />своё место.</h2>
                <p>Списки, комнаты и сроки заселения — в одном месте.</p>
            </div>
            <p class="auth-footer">Система учёта студентов общежития</p>
        </section>
        <section class="auth-card">
            <p class="small-label">Личный кабинет</p>
            <h1>{{ registering ? "Регистрация" : "С возвращением" }}</h1>
            <p class="muted">
                {{
                    registering
                        ? "Заполните данные для создания аккаунта."
                        : "Войдите, чтобы открыть список студентов."
                }}
            </p>
            <AppNotice v-if="auth.notice">{{ auth.notice }}</AppNotice>
            <AppNotice
                v-if="message"
                kind="error"
                >{{ message }}</AppNotice
            >
            <AuthForm
                :registering="registering"
                :busy="busy"
                :server-errors="errors"
                @submit="submit"
                @clear-error="field => delete errors[field]"
            />
            <p class="auth-switch">
                {{ registering ? "Уже есть аккаунт?" : "Нет аккаунта?" }}
                <RouterLink
                    :to="{
                        path: registering ? '/login' : '/register',
                        query: route.query
                    }"
                    >{{ registering ? "Войти" : "Зарегистрироваться" }}</RouterLink
                >
            </p>
        </section>
    </main>
</template>
