<script setup>
import { ref } from "vue";
import AppIcon from "./AppIcon.vue";
defineProps({ modelValue: { type: Object, required: true } });
const emit = defineEmits(["change", "reset"]);
const expanded = ref(false);
const fields = [
    ["isu", "ИСУ", "text"],
    ["fio", "ФИО", "text"],
    ["grid", "Группа", "text"],
    ["dnum", "Общежитие", "number"],
    ["rnum", "Комната", "number"],
    ["expdate", "Дата заселения", "date"],
    ["notes", "Заметки", "text"]
];
</script>

<template>
    <section
        class="filter-panel"
        aria-label="Поиск и фильтры"
    >
        <div class="filter-top">
            <label class="search-field">
                <AppIcon name="search" />
                <span class="sr-only">Поиск студентов</span>
                <input
                    type="search"
                    name="q"
                    maxlength="150"
                    :value="modelValue.q"
                    placeholder="Имя, ИСУ, группа или заметки"
                    @input="emit('change', { q: $event.target.value })"
                />
            </label>
            <button
                class="button button-secondary"
                :aria-expanded="expanded"
                aria-controls="advanced-filters"
                @click="expanded = !expanded"
            >
                <AppIcon name="filter" /> Фильтры
            </button>
            <button
                class="button button-quiet"
                @click="emit('reset')"
            >
                Сбросить
            </button>
        </div>
        <div
            v-if="expanded"
            id="advanced-filters"
            class="filter-fields"
        >
            <label
                v-for="[name, label, type] in fields"
                :key="name"
                class="field"
            >
                <span>{{ label }}</span>
                <input
                    :name="name"
                    :type="type"
                    :value="modelValue[name]"
                    :min="type === 'number' ? 1 : undefined"
                    :maxlength="name === 'notes' ? 500 : 150"
                    @input="emit('change', { [name]: $event.target.value })"
                />
            </label>
            <label class="field"
                ><span>Иностранец</span>
                <select
                    name="foreigner"
                    :value="modelValue.foreigner"
                    @change="emit('change', { foreigner: $event.target.value })"
                >
                    <option value="">Все студенты</option>
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                </select>
            </label>
        </div>
    </section>
</template>
