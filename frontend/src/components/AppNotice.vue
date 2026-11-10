<script setup>
defineProps({ kind: { type: String, default: "info" } });
</script>

<template>
    <div
        :class="['notice', `notice-${kind}`]"
        :role="kind === 'error' ? 'alert' : 'status'"
    >
        <slot />
    </div>
</template>
