<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: {
        type: String,
        default: '',
    },
});

const config = {
    pending:          { bg: 'bg-amber-50 dark:bg-amber-900/35',   border: 'border-amber-200 dark:border-amber-700/50',   text: 'text-amber-700 dark:text-amber-300',   icon: 'fa-solid fa-clock' },
    approved:         { bg: 'bg-sky-50 dark:bg-sky-900/35',       border: 'border-sky-200 dark:border-sky-700/50',       text: 'text-sky-700 dark:text-sky-300',     icon: 'fa-solid fa-thumbs-up' },
    active:           { bg: 'bg-emerald-50 dark:bg-emerald-900/35', border: 'border-emerald-200 dark:border-emerald-700/50', text: 'text-emerald-700 dark:text-emerald-300', icon: 'fa-solid fa-circle-dot' },
    completed:        { bg: 'bg-slate-100 dark:bg-slate-800/80',  border: 'border-slate-200 dark:border-slate-700/70',   text: 'text-slate-600 dark:text-slate-300',   icon: 'fa-solid fa-flag-checkered' },
    cancelled:        { bg: 'bg-rose-50 dark:bg-rose-900/35',     border: 'border-rose-200 dark:border-rose-700/50',     text: 'text-rose-700 dark:text-rose-300',    icon: 'fa-solid fa-ban' },
    submitted:        { bg: 'bg-amber-50 dark:bg-amber-900/35',   border: 'border-amber-200 dark:border-amber-700/50',   text: 'text-amber-700 dark:text-amber-300',   icon: 'fa-solid fa-paper-plane' },
    reviewed:         { bg: 'bg-emerald-50 dark:bg-emerald-900/35', border: 'border-emerald-200 dark:border-emerald-700/50', text: 'text-emerald-700 dark:text-emerald-300', icon: 'fa-solid fa-circle-check' },
    verified:         { bg: 'bg-teal-50 dark:bg-teal-900/35',     border: 'border-teal-200 dark:border-teal-700/50',     text: 'text-teal-700 dark:text-teal-300',    icon: 'fa-solid fa-check-double' },
    rejected:         { bg: 'bg-rose-50 dark:bg-rose-900/35',     border: 'border-rose-200 dark:border-rose-700/50',     text: 'text-rose-700 dark:text-rose-300',    icon: 'fa-solid fa-circle-xmark' },
    pending_approval: { bg: 'bg-amber-50 dark:bg-amber-900/35',   border: 'border-amber-200 dark:border-amber-700/50',   text: 'text-amber-700 dark:text-amber-300',   icon: 'fa-solid fa-hourglass-half' },
    draft:            { bg: 'bg-slate-100 dark:bg-slate-800/80',  border: 'border-slate-200 dark:border-slate-700/70',   text: 'text-slate-600 dark:text-slate-300',   icon: 'fa-solid fa-pen-to-square' },
    inactive:         { bg: 'bg-slate-100 dark:bg-slate-800/80',  border: 'border-slate-200 dark:border-slate-700/70',   text: 'text-slate-500 dark:text-slate-400',   icon: 'fa-solid fa-minus-circle' },
};

const style = computed(() => config[props.status?.toLowerCase()] ?? {
    bg: 'bg-slate-100 dark:bg-slate-800/80', border: 'border-slate-200 dark:border-slate-700/70', text: 'text-slate-600 dark:text-slate-300', icon: 'fa-solid fa-circle',
});

const label = computed(() => {
    const s = props.status || '';
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
});
</script>

<template>
    <span
        :class="[
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            style.bg, style.border, style.text,
        ]"
    >
        <i :class="[style.icon, 'text-[10px]']"></i>
        {{ label }}
    </span>
</template>
