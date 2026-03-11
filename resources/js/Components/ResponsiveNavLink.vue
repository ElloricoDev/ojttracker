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
        ? 'flex w-full items-center gap-3 rounded-xl bg-white/90 px-4 py-2 text-start text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-emerald-200/70'
        : 'flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium text-slate-600 transition hover:bg-white/70 hover:text-slate-900',
);
</script>

<template>
    <Link :href="href" :class="classes">
        <slot />
    </Link>
</template>
