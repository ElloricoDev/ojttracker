<script setup>
const props = defineProps({
    label: String,
    sortKey: {
        type: String,
        required: true,
    },
    activeSort: {
        type: String,
        default: '',
    },
    direction: {
        type: String,
        default: 'asc',
    },
});

const emit = defineEmits(['sort']);

const isActive = () => props.activeSort === props.sortKey;

const handleClick = () => {
    let nextDirection = 'asc';

    if (isActive()) {
        nextDirection = props.direction === 'asc' ? 'desc' : 'asc';
    }

    emit('sort', { key: props.sortKey, direction: nextDirection });
};
</script>

<template>
    <th class="px-2 py-2">
        <button type="button" class="inline-flex items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition-colors duration-150 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" @click="handleClick">
            <span>{{ label }}</span>
            <span class="inline-flex flex-col text-[9px] leading-none">
                <i class="fa-solid fa-caret-up" :class="isActive() && direction === 'asc' ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'"></i>
                <i class="fa-solid fa-caret-down -mt-0.5" :class="isActive() && direction === 'desc' ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'"></i>
            </span>
        </button>
    </th>
</template>
