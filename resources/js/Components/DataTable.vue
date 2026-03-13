<script setup>
import { Link } from '@inertiajs/vue3';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

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
const searchInputRef = ref(null);
const suppressNextSearchEmit = ref(false);
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
        if (suppressNextSearchEmit.value) {
            suppressNextSearchEmit.value = false;
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

const emitSearchNow = () => {
    if (!props.showSearch) {
        return;
    }
    if (searchTimer) {
        clearTimeout(searchTimer);
        searchTimer = null;
    }
    emit('search', localSearch.value);
};

const clearSearch = async () => {
    suppressNextSearchEmit.value = true;
    localSearch.value = '';
    emitSearchNow();

    await nextTick();
    searchInputRef.value?.focus();
};

const handleSearchEscape = () => {
    if (localSearch.value) {
        clearSearch();
    }
};

const isTypingTarget = (target) => {
    if (!target || !(target instanceof HTMLElement)) {
        return false;
    }

    if (target.isContentEditable) {
        return true;
    }

    const tag = target.tagName?.toLowerCase();

    return ['input', 'textarea', 'select'].includes(tag);
};

const focusSearchInput = async () => {
    if (!props.showSearch) {
        return;
    }

    await nextTick();
    searchInputRef.value?.focus();
    searchInputRef.value?.select?.();
};

const handleGlobalSearchShortcut = (event) => {
    if (
        !props.showSearch ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key !== '/'
    ) {
        return;
    }

    if (isTypingTarget(event.target)) {
        return;
    }

    event.preventDefault();
    focusSearchInput();
};

onMounted(() => {
    window.addEventListener('keydown', handleGlobalSearchShortcut);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalSearchShortcut);
});
</script>

<template>
    <div class="card card-body space-y-4">
        <div class="flex flex-wrap items-center gap-3">
            <div v-if="showSearch" class="relative min-w-[220px] flex-1">
                <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                <input
                    ref="searchInputRef"
                    v-model="localSearch"
                    type="search"
                    class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-emerald-400 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-600 dark:focus:ring-emerald-600"
                    :placeholder="searchPlaceholder"
                    @keydown.esc.prevent="handleSearchEscape"
                    @keydown.enter.prevent="emitSearchNow"
                />
                <button
                    v-if="localSearch"
                    type="button"
                    class="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label="Clear search"
                    title="Clear search"
                    @click="clearSearch"
                >
                    <i class="fa-solid fa-xmark text-[11px]"></i>
                </button>
                <span
                    v-else
                    class="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-400"
                    title="Press / to focus search"
                >
                    /
                </span>
            </div>

            <slot name="filters" />

            <div v-if="showPerPage" class="relative w-full max-w-[160px]">
                <i class="fa-solid fa-list-ol pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                <select
                    class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-600 dark:focus:ring-emerald-600"
                    :value="perPage"
                    @change="handlePerPageChange"
                >
                    <option v-for="size in perPageOptions" :key="size" :value="size">
                        {{ size }} / page
                    </option>
                </select>
            </div>

            <div v-if="pagination?.total !== undefined" class="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-500">
                {{ pagination.total.toLocaleString() }} {{ pagination.total === 1 ? 'record' : 'records' }}
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="table-base">
                <slot name="table" />
            </table>
        </div>

        <div v-if="pagination?.links && pagination.links.length > 3" class="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div class="text-xs text-slate-400 dark:text-slate-500">
                Showing <span class="font-semibold text-slate-600 dark:text-slate-200">{{ pagination.from || 0 }}</span>–<span class="font-semibold text-slate-600 dark:text-slate-200">{{ pagination.to || 0 }}</span> of <span class="font-semibold text-slate-600 dark:text-slate-200">{{ pagination.total || 0 }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
                <Link
                    v-for="(link, index) in pagination.links"
                    :key="`${link.label}-${index}`"
                    :href="link.url || '#'"
                    class="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-2.5 text-xs font-medium transition duration-150"
                    :class="[
                        link.active ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-emerald-500/70 dark:bg-emerald-600' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700/70',
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
