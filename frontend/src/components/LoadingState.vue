<script setup>
defineProps({ label: { type: String, default: "Загрузка…" } });
</script>

<template>
    <div
        class="loading-state"
        role="status"
        aria-live="polite"
    >
        <span
            class="spinner"
            aria-hidden="true"
        ></span
        >{{ label }}
    </div>
</template>
