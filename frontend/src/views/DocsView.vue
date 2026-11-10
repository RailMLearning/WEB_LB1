<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import PageHeading from "../components/PageHeading.vue";
import AppNotice from "../components/AppNotice.vue";
import LoadingState from "../components/LoadingState.vue";
import "swagger-ui-dist/swagger-ui.css";

const container = ref(null);
const loading = ref(true);
const error = ref("");
let active = true;
onUnmounted(() => {
    active = false;
});
onMounted(async () => {
    try {
        const { default: SwaggerUI } = await import("swagger-ui-dist/swagger-ui-es-bundle.js");
        if (!active) return;
        SwaggerUI({ url: "/api/openapi.json", domNode: container.value, deepLinking: true });
    } catch {
        if (active) error.value = "Не удалось открыть документацию API.";
    } finally {
        if (active) loading.value = false;
    }
});
</script>

<template>
    <PageHeading
        title="Документация API"
        description="Запросы к серверу и форматы ответов."
    />
    <LoadingState v-if="loading" />
    <AppNotice
        v-if="error"
        kind="error"
        >{{ error }}</AppNotice
    >
    <div
        ref="container"
        class="swagger-container"
    ></div>
</template>
