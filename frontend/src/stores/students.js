import { onScopeDispose, reactive, ref, watch } from "vue";
import { defineStore } from "pinia";
import { listStudents } from "../services/students.js";
import { createStudentSearch } from "../services/studentSearch.js";

export function defaultQuery() {
    return {
        q: "", isu: "", fio: "", grid: "", dnum: "", rnum: "",
        expdate: "", foreigner: "", notes: "",
        sort: "isu", order: "asc", page: 0, size: 20
    };
}

export const useStudentsStore = defineStore("students", () => {
    const query = reactive(defaultQuery());
    const items = ref([]);
    const total = ref(0);
    const loading = ref(true);
    const error = ref(null);
    const search = createStudentSearch(listStudents, { ...query });

    watch(query, value => {
        loading.value = true;
        search.setQuery(value);
    });
    onScopeDispose(() => search.destroy());

    function connect() {
        loading.value = true;
        const subscription = search.results$.subscribe(state => {
            loading.value = state.loading;
            error.value = state.error;
            if (state.items) {
                items.value = state.items;
                total.value = state.total;
                const lastPage = Math.max(0, Math.ceil(state.total / query.size) - 1);
                if (query.page > lastPage) query.page = lastPage;
            }
        });
        return () => subscription.unsubscribe();
    }

    function setFilters(patch) {
        Object.assign(query, patch, { page: 0 });
    }

    function reset() {
        const unchanged = JSON.stringify(query) === JSON.stringify(defaultQuery());
        Object.assign(query, defaultQuery());
        items.value = [];
        total.value = 0;
        error.value = null;
        if (unchanged) search.reload();
    }

    return { query, items, total, loading, error, connect, setFilters, reset, reload: search.reload };
});
