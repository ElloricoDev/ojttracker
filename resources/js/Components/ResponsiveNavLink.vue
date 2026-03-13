<script setup>
import { computed } from 'vue';
import { Link } from '@inertiajs/vue3';

const props = defineProps({
    href: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
    },
});

const classes = computed(() =>
    props.active
        ? 'flex w-full items-center gap-3 rounded-xl bg-white/90 px-4 py-2 text-start text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-emerald-200/70 dark:bg-slate-800/90 dark:text-slate-100 dark:ring-emerald-900/40'
        : 'flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium text-slate-600 transition hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100',
);
</script>

<template>
    <Link :href="href" :class="classes">
        <slot />
    </Link>
</template>
