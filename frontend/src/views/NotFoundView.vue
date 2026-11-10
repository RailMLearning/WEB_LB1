<script setup>
import { RouterLink } from "vue-router";
defineProps({ forbidden: Boolean });
</script>

<template>
    <section class="empty-state error-page">
        <p class="error-code">{{ forbidden ? "403" : "404" }}</p>
        <h1>{{ forbidden ? "Недостаточно прав" : "Страница не найдена" }}</h1>
        <p>
            {{
                forbidden
                    ? "Это действие доступно только администратору."
                    : "Проверьте адрес или вернитесь к списку студентов."
            }}
        </p>
        <RouterLink
            class="button button-primary"
            to="/students"
            >К списку студентов</RouterLink
        >
    </section>
</template>
