<script setup>
import { computed, reactive } from "vue";
import { validateAuth } from "../services/validation.js";

const props = defineProps({ registering: Boolean, busy: Boolean, serverErrors: Object });
const emit = defineEmits(["submit", "clear-error"]);
const data = reactive({ username: "", email: "", password: "" });
const errors = reactive({});
const fields = computed(() => [
    { name: "username", label: "Логин", type: "text", autocomplete: "username", max: 40 },
    ...(props.registering
        ? [{ name: "email", label: "Электронная почта", type: "email", autocomplete: "email", max: 254 }]
        : []),
    { name: "password", label: "Пароль", type: "password",
        autocomplete: props.registering ? "new-password" : "current-password" }
]);

function submit() {
    if (props.busy) return;
    Object.keys(errors).forEach(key => delete errors[key]);
    Object.assign(errors, validateAuth(data, props.registering));
    if (Object.keys(errors).length) return;
    const result = { username: data.username.trim(), password: data.password };
    if (props.registering) result.email = data.email.trim();
    emit("submit", result);
}
</script>

<template>
    <form class="auth-form" novalidate @submit.prevent="submit" :aria-busy="busy">
        <fieldset :disabled="busy">
            <div v-for="field in fields" :key="field.name" class="field">
                <label :for="`auth-${field.name}`">{{ field.label }}</label>
                <input :id="`auth-${field.name}`" :name="field.name" :type="field.type"
                    v-model="data[field.name]" :autocomplete="field.autocomplete"
                    :maxlength="field.max" required
                    :aria-invalid="Boolean(errors[field.name] || serverErrors?.[field.name])"
                    :aria-describedby="`auth-${field.name}-error`"
                    @input="delete errors[field.name]; emit('clear-error', field.name)" />
                <span :id="`auth-${field.name}-error`" class="field-error">
                    {{ errors[field.name] || serverErrors?.[field.name] }}
                </span>
            </div>
            <p class="form-hint" v-if="registering">
                Пароль — от 8 символов. Новый аккаунт получает доступ к просмотру студентов.
            </p>
            <button class="button button-primary button-wide" type="submit">
                <span v-if="busy" class="spinner" aria-hidden="true"></span>
                {{ busy ? "Подождите…" : registering ? "Создать аккаунт" : "Войти" }}
            </button>
        </fieldset>
    </form>
</template>
