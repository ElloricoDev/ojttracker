<script setup>
defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
});
</script>

<template>
    <button
        class="inline-flex items-center gap-2 rounded-xl border border-transparent bg-slate-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition duration-150 ease-in-out hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/40 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus:ring-emerald-500/40"
        :disabled="loading"
    >
        <span v-if="loading" class="spinner"></span>
        <slot />
    </button>
</template>
