<script setup>
defineProps({ name: { type: String, required: true } });
const paths = {
    building: "M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M9 21v-3h2v3",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
    user: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    book: "M4 3h6a3 3 0 0 1 3 3v15a4 4 0 0 0-4-2H4zM13 6a3 3 0 0 1 3-3h5v16h-4a4 4 0 0 0-4 2",
    logout: "M9 21H4V3h5M14 8l5 4-5 4M8 12h11",
    plus: "M12 5v14M5 12h14",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    filter: "M4 6h16M7 12h10M10 18h4",
    edit: "m16 3 5 5M4 20l1-6L17 2l5 5-12 12z",
    trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
    back: "m12 5-7 7 7 7M5 12h14",
    arrow: "m9 5 7 7-7 7",
    check: "m5 12 4 4L20 5"
};
</script>

<template>
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="icon"
    >
        <path :d="paths[name] || paths.user" />
        <circle
            v-if="name === 'users'"
            cx="9"
            cy="7"
            r="4"
        />
    </svg>
</template>
