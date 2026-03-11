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
        <button type="button" class="inline-flex items-center gap-1 text-left text-sm font-semibold text-slate-700 hover:text-slate-900" @click="handleClick">
            <span>{{ label }}</span>
            <span class="inline-flex flex-col text-[10px] leading-none">
                <i class="fa-solid fa-caret-up" :class="isActive() && direction === 'asc' ? 'text-slate-900' : 'text-slate-300'"></i>
                <i class="fa-solid fa-caret-down -mt-1" :class="isActive() && direction === 'desc' ? 'text-slate-900' : 'text-slate-300'"></i>
            </span>
        </button>
    </th>
</template>
