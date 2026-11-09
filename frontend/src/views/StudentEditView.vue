<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { getStudent, saveStudent } from "../services/students.js";
import { fieldErrors } from "../services/validation.js";
import PageHeading from "../components/PageHeading.vue";
import StudentForm from "../components/StudentForm.vue";
import AppNotice from "../components/AppNotice.vue";
import LoadingState from "../components/LoadingState.vue";
import AppIcon from "../components/AppIcon.vue";

const props = defineProps({ isu: String });
const router = useRouter();
const editing = computed(() => props.isu !== undefined);
const initial = ref(null);
const loading = ref(editing.value);
const busy = ref(false);
const loadError = ref(null);
const saveError = ref("");
const errors = ref({});
const controller = new AbortController();
let active = true;
onUnmounted(() => { active = false; controller.abort(); });

async function load() {
    if (!editing.value) return;
    loading.value = true;
    loadError.value = null;
    try {
        initial.value = await getStudent(props.isu, controller.signal);
    } catch (error) {
        if (active) loadError.value = error;
    } finally {
        if (active) loading.value = false;
    }
}
onMounted(load);

async function save(data) {
    if (busy.value) return;
    busy.value = true;
    saveError.value = "";
    errors.value = {};
    try {
        const student = await saveStudent(data, editing.value ? props.isu : null);
        if (active) await router.push(`/students/${student.isu}`);
    } catch (error) {
        if (active) {
            saveError.value = error.message;
            errors.value = fieldErrors(error);
            if (error.status === 409 && !errors.value.isu) errors.value.isu = error.message;
        }
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <RouterLink to="/students" class="back-link"><AppIcon name="back" /> К списку студентов</RouterLink>
    <PageHeading :title="editing ? 'Редактирование студента' : 'Новый студент'"
        description="Поля со звёздочкой обязательны для заполнения." />
    <LoadingState v-if="loading" label="Загружаем данные студента…" />
    <section v-else-if="loadError" class="content-panel">
        <AppNotice kind="error">{{ loadError.message }}</AppNotice>
        <button v-if="loadError.status !== 404" class="button button-secondary" @click="load">
            Повторить запрос
        </button>
    </section>
    <section v-else class="content-panel form-panel">
        <AppNotice v-if="saveError" kind="error">{{ saveError }}</AppNotice>
        <StudentForm :initial="initial" :busy="busy" :server-errors="errors" @submit="save"
            @clear-error="field => delete errors[field]" />
    </section>
</template>
