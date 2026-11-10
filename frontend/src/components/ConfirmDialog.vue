<script setup>
import { onMounted, ref } from "vue";
import AppNotice from "./AppNotice.vue";
const props = defineProps({ student: Object, busy: Boolean, error: String });
const emit = defineEmits(["confirm", "cancel"]);
const dialog = ref(null);
onMounted(() => dialog.value.showModal());

function cancel(event) {
    event.preventDefault();
    if (!props.busy) emit("cancel");
}
</script>

<template>
    <dialog
        ref="dialog"
        class="confirm-dialog"
        aria-labelledby="delete-title"
        @cancel="cancel"
    >
        <h2 id="delete-title">Удалить студента?</h2>
        <p>
            <strong>{{ student.fio }}</strong
            >, ИСУ {{ student.isu }}.
        </p>
        <p class="muted">Запись будет удалена. Отменить это действие нельзя.</p>
        <AppNotice
            v-if="error"
            kind="error"
            >{{ error }}</AppNotice
        >
        <div class="dialog-actions">
            <button
                class="button button-secondary"
                :disabled="busy"
                @click="emit('cancel')"
            >
                Отмена
            </button>
            <button
                class="button button-danger"
                :disabled="busy"
                @click="emit('confirm')"
            >
                <span
                    v-if="busy"
                    class="spinner"
                    aria-hidden="true"
                ></span>
                {{ busy ? "Удаляем…" : "Удалить" }}
            </button>
        </div>
    </dialog>
</template>
