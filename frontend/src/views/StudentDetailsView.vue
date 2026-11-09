<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getStudent } from "../services/students.js";
import { formatDate } from "../services/validation.js";
import { useAuthStore } from "../stores/auth.js";
import PageHeading from "../components/PageHeading.vue";
import AppNotice from "../components/AppNotice.vue";
import AppIcon from "../components/AppIcon.vue";
import LoadingState from "../components/LoadingState.vue";

const props = defineProps({ isu: { type: String, required: true } });
const auth = useAuthStore();
const student = ref(null);
const loading = ref(true);
const error = ref(null);
const controller = new AbortController();
let active = true;
onUnmounted(() => { active = false; controller.abort(); });
const fields = computed(() => student.value ? [
    ["Номер ИСУ", student.value.isu], ["ФИО", student.value.fio],
    ["Группа", student.value.grid], ["Общежитие", student.value.dnum],
    ["Комната", student.value.rnum], ["Дата заселения", formatDate(student.value.expdate)],
    ["Иностранец", student.value.foreigner ? "Да" : "Нет"]
] : []);

async function load() {
    loading.value = true;
    error.value = null;
    try {
        const result = await getStudent(props.isu, controller.signal);
        if (active) student.value = result;
    } catch (reason) {
        if (active) error.value = reason;
    } finally {
        if (active) loading.value = false;
    }
}
onMounted(load);
</script>

<template>
    <RouterLink to="/students" class="back-link"><AppIcon name="back" /> К списку студентов</RouterLink>
    <PageHeading :title="student?.fio || 'Карточка студента'" :description="`ИСУ ${isu}`">
        <RouterLink v-if="student && auth.isAdmin" :to="`/students/${student.isu}/edit`"
            class="button button-primary"><AppIcon name="edit" /> Изменить</RouterLink>
    </PageHeading>
    <LoadingState v-if="loading" label="Загружаем карточку…" />
    <section v-else-if="error" class="content-panel">
        <AppNotice kind="error">{{ error.status === 404 ? 'Студент с таким ИСУ не найден.' : error.message }}</AppNotice>
        <button v-if="error.status !== 404" class="button button-secondary" @click="load">Повторить запрос</button>
    </section>
    <section v-else-if="student" class="content-panel details-panel">
        <h2>Информация о студенте</h2>
        <dl class="details-grid">
            <div v-for="[label, value] in fields" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div>
        </dl>
        <div class="notes-block"><h3>Заметки</h3><p>{{ student.notes || "Нет заметок." }}</p></div>
    </section>
</template>
