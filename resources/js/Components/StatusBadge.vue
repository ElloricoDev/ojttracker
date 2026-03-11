<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: {
        type: String,
        default: '',
    },
});

const config = {
    pending:          { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'fa-solid fa-clock' },
    approved:         { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     icon: 'fa-solid fa-thumbs-up' },
    active:           { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'fa-solid fa-circle-dot' },
    completed:        { bg: 'bg-slate-100',  border: 'border-slate-200',   text: 'text-slate-600',   icon: 'fa-solid fa-flag-checkered' },
    cancelled:        { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    icon: 'fa-solid fa-ban' },
    submitted:        { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'fa-solid fa-paper-plane' },
    reviewed:         { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'fa-solid fa-circle-check' },
    verified:         { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    icon: 'fa-solid fa-check-double' },
    rejected:         { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    icon: 'fa-solid fa-circle-xmark' },
    pending_approval: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'fa-solid fa-hourglass-half' },
    draft:            { bg: 'bg-slate-100',  border: 'border-slate-200',   text: 'text-slate-600',   icon: 'fa-solid fa-pen-to-square' },
    inactive:         { bg: 'bg-slate-100',  border: 'border-slate-200',   text: 'text-slate-500',   icon: 'fa-solid fa-minus-circle' },
};

const style = computed(() => config[props.status?.toLowerCase()] ?? {
    bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-600', icon: 'fa-solid fa-circle',
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
