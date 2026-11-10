<script setup>
import { RouterLink } from "vue-router";
import { formatDate } from "../services/validation.js";
import AppIcon from "./AppIcon.vue";
defineProps({ students: Array, isAdmin: Boolean, loading: Boolean });
defineEmits(["delete"]);
</script>

<template>
    <div class="table-scroll">
        <table
            class="student-table"
            :aria-busy="loading"
        >
            <caption class="sr-only">
                Студенты общежития
            </caption>
            <thead>
                <tr>
                    <th scope="col">Студент</th>
                    <th scope="col">Группа</th>
                    <th scope="col">Общежитие / комната</th>
                    <th scope="col">Дата заселения</th>
                    <th scope="col">Иностранец</th>
                    <th scope="col"><span class="sr-only">Действия</span></th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="student in students"
                    :key="student.isu"
                    :data-isu="student.isu"
                >
                    <td>
                        <RouterLink
                            :to="`/students/${student.isu}`"
                            class="student-name"
                        >
                            {{ student.fio }} </RouterLink
                        ><span class="student-id">ИСУ {{ student.isu }}</span>
                    </td>
                    <td>{{ student.grid }}</td>
                    <td>
                        <span class="room-number">{{ student.dnum }} / {{ student.rnum }}</span>
                    </td>
                    <td>{{ formatDate(student.expdate) }}</td>
                    <td>
                        <span :class="['foreign-label', { foreign: student.foreigner }]">
                            {{ student.foreigner ? "Да" : "Нет" }}
                        </span>
                    </td>
                    <td>
                        <div
                            v-if="isAdmin"
                            class="row-actions"
                        >
                            <RouterLink
                                :to="`/students/${student.isu}/edit`"
                                class="icon-button"
                                :aria-label="`Изменить: ${student.fio}`"
                                ><AppIcon name="edit"
                            /></RouterLink>
                            <button
                                class="icon-button danger-text"
                                :disabled="loading"
                                :aria-label="`Удалить: ${student.fio}`"
                                @click="$emit('delete', student)"
                            >
                                <AppIcon name="trash" />
                            </button>
                        </div>
                        <RouterLink
                            v-else
                            :to="`/students/${student.isu}`"
                            class="icon-button"
                            :aria-label="`Подробнее: ${student.fio}`"
                        >
                            <AppIcon name="arrow" />
                        </RouterLink>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
