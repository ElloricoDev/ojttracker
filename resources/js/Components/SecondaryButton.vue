<script setup>
defineProps({
    type: {
        type: String,
        default: 'button',
    },
    loading: {
        type: Boolean,
        default: false,
    },
});
</script>

<template>
    <button
        :type="type"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-700 shadow-sm transition duration-150 ease-in-out hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:focus:ring-slate-500/40"
        :disabled="loading"
    >
        <span v-if="loading" class="spinner border-slate-500 dark:border-slate-300"></span>
        <slot />
    </button>
</template>
