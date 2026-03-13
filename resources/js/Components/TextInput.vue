<script setup>
import { onMounted, ref } from 'vue';

defineProps({
    hasError: {
        type: Boolean,
        default: false,
    },
});

const model = defineModel({
    type: String,
    required: true,
});

const input = ref(null);

onMounted(() => {
    if (input.value.hasAttribute('autofocus')) {
        input.value.focus();
    }
});

defineExpose({ focus: () => input.value.focus() });
</script>

<template>
    <input
        :class="[
            'w-full rounded-xl border bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm transition duration-150 focus:ring-1 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder-slate-500',
            hasError
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400 dark:border-rose-700 dark:focus:border-rose-500 dark:focus:ring-rose-500'
                : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 dark:border-slate-700 dark:focus:border-emerald-600 dark:focus:ring-emerald-600',
        ]"
        v-model="model"
        ref="input"
    />
</template>
