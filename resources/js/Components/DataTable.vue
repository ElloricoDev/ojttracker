<script setup>
import { Link } from '@inertiajs/vue3';
import { ref, watch } from 'vue';

const props = defineProps({
    search: {
        type: String,
        default: '',
    },
    searchPlaceholder: {
        type: String,
        default: 'Search',
    },
    perPage: {
        type: Number,
        default: 10,
    },
    perPageOptions: {
        type: Array,
        default: () => [10, 25, 50, 100],
    },
    pagination: {
        type: Object,
        default: null,
    },
    showSearch: {
        type: Boolean,
        default: true,
    },
    showPerPage: {
        type: Boolean,
        default: true,
    },
    debounce: {
        type: Number,
        default: 300,
    },
});

const emit = defineEmits(['search', 'per-page']);

const localSearch = ref(props.search);
let searchTimer = null;

watch(
    () => props.search,
    (value) => {
        localSearch.value = value || '';
    },
);

watch(
    () => localSearch.value,
    (value) => {
        if (!props.showSearch) {
            return;
        }
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
        searchTimer = setTimeout(() => {
            emit('search', value);
        }, props.debounce);
    },
);

const handlePerPageChange = (event) => {
    emit('per-page', event.target.value);
};
</script>

<template>
    <div class="card card-body space-y-4">
        <div class="flex flex-wrap items-center gap-3">
            <div v-if="showSearch" class="relative min-w-[220px] flex-1">
                <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                <input
                    v-model="localSearch"
                    type="search"
                    class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition focus:border-emerald-400 focus:ring-emerald-400"
                    :placeholder="searchPlaceholder"
                />
            </div>

            <slot name="filters" />

            <div v-if="showPerPage" class="relative w-full max-w-[160px]">
                <i class="fa-solid fa-list-ol pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                <select
                    class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                    :value="perPage"
                    @change="handlePerPageChange"
                >
                    <option v-for="size in perPageOptions" :key="size" :value="size">
                        {{ size }} / page
                    </option>
                </select>
            </div>

            <div v-if="pagination?.total !== undefined" class="ml-auto shrink-0 text-xs text-slate-400">
                {{ pagination.total.toLocaleString() }} {{ pagination.total === 1 ? 'record' : 'records' }}
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="table-base">
                <slot name="table" />
            </table>
        </div>

        <div v-if="pagination?.links && pagination.links.length > 3" class="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <div class="text-xs text-slate-400">
                Showing <span class="font-semibold text-slate-600">{{ pagination.from || 0 }}</span>–<span class="font-semibold text-slate-600">{{ pagination.to || 0 }}</span> of <span class="font-semibold text-slate-600">{{ pagination.total || 0 }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
                <Link
                    v-for="(link, index) in pagination.links"
                    :key="`${link.label}-${index}`"
                    :href="link.url || '#'"
                    class="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2.5 text-xs font-medium transition duration-150"
                    :class="[
                        link.active ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                        !link.url ? 'pointer-events-none opacity-40' : ''
                    ]"
                    preserve-state
                    preserve-scroll
                >
                    <span v-html="link.label"></span>
                </Link>
            </div>
        </div>
    </div>
</template>
