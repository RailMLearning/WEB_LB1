<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { useStudentsStore } from "../stores/students.js";
import { deleteStudent } from "../services/students.js";
import PageHeading from "../components/PageHeading.vue";
import StudentFilters from "../components/StudentFilters.vue";
import StudentTable from "../components/StudentTable.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import AppNotice from "../components/AppNotice.vue";
import AppIcon from "../components/AppIcon.vue";
import LoadingState from "../components/LoadingState.vue";

const auth = useAuthStore();
const store = useStudentsStore();
const selected = ref(null);
const deleting = ref(false);
const deleteError = ref("");
const success = ref("");
const pages = computed(() => Math.max(1, Math.ceil(store.total / store.query.size)));
const first = computed(() => store.total ? store.query.page * store.query.size + 1 : 0);
const last = computed(() => Math.min((store.query.page + 1) * store.query.size, store.total));
let disconnect;
onMounted(() => { disconnect = store.connect(); });
onUnmounted(() => disconnect?.());
const sortFields = [
    ["isu", "ИСУ"], ["fio", "ФИО"], ["grid", "Группа"], ["dnum", "Общежитие"],
    ["rnum", "Комната"], ["expdate", "Дата заселения"], ["foreigner", "Иностранец"],
    ["notes", "Заметки"]
];

async function remove() {
    if (deleting.value) return;
    deleting.value = true;
    deleteError.value = "";
    try {
        await deleteStudent(selected.value.isu);
        selected.value = null;
        success.value = "Запись студента удалена.";
        store.reload();
    } catch (error) {
        deleteError.value = error.message;
    } finally {
        deleting.value = false;
    }
}
</script>

<template>
    <PageHeading title="Студенты" description="Заселение, комнаты и информация о студентах.">
        <RouterLink v-if="auth.isAdmin" to="/students/new" class="button button-primary">
            <AppIcon name="plus" /> Добавить студента
        </RouterLink>
    </PageHeading>
    <AppNotice v-if="!auth.isAdmin">Доступен просмотр записей. Изменения вносит администратор.</AppNotice>
    <AppNotice v-if="success" kind="success">{{ success }}</AppNotice>
    <StudentFilters :model-value="store.query" @change="store.setFilters" @reset="store.reset" />
    <section class="records-panel" aria-label="Список студентов">
        <div class="records-toolbar">
            <span class="record-count">Найдено студентов <strong>{{ store.total }}</strong></span>
            <div class="sort-controls">
                <label><span class="sr-only">Сортировать по</span>
                    <select aria-label="Сортировать по" :value="store.query.sort"
                        @change="store.setFilters({ sort: $event.target.value })">
                        <option v-for="[value, label] in sortFields" :key="value" :value="value">
                            {{ label }}
                        </option>
                    </select>
                </label>
                <select aria-label="Порядок сортировки" :value="store.query.order"
                    @change="store.setFilters({ order: $event.target.value })">
                    <option value="asc">По возрастанию</option>
                    <option value="desc">По убыванию</option>
                </select>
                <button class="icon-button" aria-label="Обновить список" :disabled="store.loading"
                    @click="store.reload()">↻</button>
            </div>
        </div>
        <LoadingState v-if="store.loading" label="Загружаем студентов…" />
        <div v-if="store.error" class="panel-message">
            <AppNotice kind="error">{{ store.error.message }}</AppNotice>
            <button class="button button-secondary" @click="store.reload()">Повторить запрос</button>
        </div>
        <StudentTable v-else-if="store.items.length" :students="store.items"
            :is-admin="auth.isAdmin" :loading="store.loading"
            @delete="student => { selected = student; deleteError = ''; success = ''; }" />
        <div v-else-if="!store.loading" class="empty-state">
            <AppIcon name="users" /><h2>Студенты не найдены</h2>
            <p>Измените условия поиска или сбросьте фильтры.</p>
            <button class="button button-secondary" @click="store.reset()">Сбросить фильтры</button>
        </div>
        <footer class="pagination">
            <div class="page-size"><label for="page-size">На странице</label>
                <select id="page-size" :value="store.query.size"
                    @change="store.setFilters({ size: Number($event.target.value) })">
                    <option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">{{ size }}</option>
                </select><span>{{ first }}–{{ last }} из {{ store.total }}</span>
            </div>
            <div class="page-buttons">
                <button class="button button-secondary" :disabled="store.query.page === 0 || store.loading"
                    aria-label="Предыдущая страница" @click="store.query.page -= 1">Назад</button>
                <span role="status">{{ store.query.page + 1 }} / {{ pages }}</span>
                <button class="button button-secondary"
                    :disabled="store.query.page + 1 >= pages || store.loading"
                    aria-label="Следующая страница" @click="store.query.page += 1">Далее</button>
            </div>
        </footer>
    </section>
    <ConfirmDialog v-if="selected" :student="selected" :busy="deleting" :error="deleteError"
        @cancel="selected = null" @confirm="remove" />
</template>
