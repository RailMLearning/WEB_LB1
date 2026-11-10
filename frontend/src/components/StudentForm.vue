<script setup>
import { reactive } from "vue";
import { RouterLink } from "vue-router";
import { emptyStudent, validateStudent } from "../services/validation.js";

const props = defineProps({ initial: Object, busy: Boolean, serverErrors: Object });
const emit = defineEmits(["submit", "clear-error"]);
const form = reactive({ ...emptyStudent(), ...props.initial });
const errors = reactive({});
const fields = [
    { name: "fio", label: "ФИО", type: "text", max: 150, wide: true },
    { name: "isu", label: "Номер ИСУ", type: "text", max: 7, hint: "От 5 до 7 цифр" },
    { name: "grid", label: "Группа", type: "text", max: 6, hint: "Например, M3301" },
    { name: "dnum", label: "Номер общежития", type: "number", min: 1 },
    { name: "rnum", label: "Комната", type: "number", min: 1 },
    { name: "expdate", label: "Дата заселения", type: "date", min: "1900-01-01", max: "9999-12-31" }
];

function submit() {
    if (props.busy) return;
    Object.keys(errors).forEach(key => delete errors[key]);
    Object.assign(errors, validateStudent(form));
    if (Object.keys(errors).length) return;
    const data = Object.fromEntries(
        Object.entries(form).map(([name, value]) => [
            name,
            typeof value === "string" ? value.trim() : value
        ])
    );
    emit("submit", data);
}
</script>

<template>
    <form
        class="student-form"
        novalidate
        :aria-busy="busy"
        @submit.prevent="submit"
    >
        <fieldset
            :disabled="busy"
            class="form-grid"
        >
            <legend class="sr-only">Данные студента</legend>
            <div
                v-for="field in fields"
                :key="field.name"
                :class="['field', { 'field-wide': field.wide }]"
            >
                <label :for="`student-${field.name}`"
                    >{{ field.label }} <span aria-hidden="true">*</span></label
                >
                <input
                    :id="`student-${field.name}`"
                    :name="field.name"
                    :type="field.type"
                    v-model="form[field.name]"
                    :maxlength="field.type === 'text' ? field.max : undefined"
                    :min="field.min"
                    :max="field.type === 'date' ? field.max : undefined"
                    :step="field.type === 'number' ? 1 : undefined"
                    required
                    :aria-invalid="Boolean(errors[field.name] || serverErrors?.[field.name])"
                    :aria-describedby="`student-${field.name}-help`"
                    @input="
                        delete errors[field.name];
                        emit('clear-error', field.name);
                    "
                />
                <span
                    :id="`student-${field.name}-help`"
                    :class="
                        errors[field.name] || serverErrors?.[field.name]
                            ? 'field-error'
                            : 'form-hint'
                    "
                >
                    {{ errors[field.name] || serverErrors?.[field.name] || field.hint }}
                </span>
            </div>
            <div class="field field-wide">
                <label
                    class="checkbox-field"
                    for="student-foreigner"
                >
                    <input
                        id="student-foreigner"
                        name="foreigner"
                        type="checkbox"
                        v-model="form.foreigner"
                    />
                    Иностранный студент
                </label>
            </div>
            <div class="field field-wide">
                <label for="student-notes"
                    >Заметки <span class="optional">Необязательно</span></label
                >
                <textarea
                    id="student-notes"
                    name="notes"
                    rows="4"
                    maxlength="500"
                    v-model="form.notes"
                    :aria-invalid="Boolean(errors.notes || serverErrors?.notes)"
                    aria-describedby="student-notes-help"
                    @input="
                        delete errors.notes;
                        emit('clear-error', 'notes');
                    "
                ></textarea>
                <span
                    id="student-notes-help"
                    :class="errors.notes || serverErrors?.notes ? 'field-error' : 'form-hint'"
                >
                    {{
                        errors.notes || serverErrors?.notes || `${form.notes.length} / 500 символов`
                    }}
                </span>
            </div>
            <div class="form-actions field-wide">
                <button
                    class="button button-primary"
                    type="submit"
                >
                    <span
                        v-if="busy"
                        class="spinner"
                        aria-hidden="true"
                    ></span>
                    {{ busy ? "Сохраняем…" : "Сохранить" }}
                </button>
                <RouterLink
                    class="button button-secondary"
                    :class="{ 'disabled-link': busy }"
                    :aria-disabled="busy"
                    to="/students"
                    >Отмена</RouterLink
                >
            </div>
        </fieldset>
    </form>
</template>
