<script setup>
import Modal from '@/Components/Modal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';

const props = defineProps({
    show: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm action' },
    message: { type: String, default: 'Are you sure you want to continue?' },
    confirmLabel: { type: String, default: 'Confirm' },
    cancelLabel: { type: String, default: 'Cancel' },
    tone: { type: String, default: 'danger' },
});

const emit = defineEmits(['confirm', 'close']);

const confirm = () => emit('confirm');
const close = () => emit('close');

const toneIcon = {
    danger:  { icon: 'fa-solid fa-triangle-exclamation', bg: 'bg-rose-100 dark:bg-rose-900/35', text: 'text-rose-600 dark:text-rose-300' },
    warning: { icon: 'fa-solid fa-circle-info',          bg: 'bg-amber-100 dark:bg-amber-900/35', text: 'text-amber-600 dark:text-amber-300' },
    success: { icon: 'fa-solid fa-circle-check',         bg: 'bg-emerald-100 dark:bg-emerald-900/35', text: 'text-emerald-600 dark:text-emerald-300' },
};
</script>

<template>
    <Modal :show="show" max-width="md" @close="close">
        <div class="p-6">
            <div class="flex items-start gap-4">
                <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm"
                    :class="[toneIcon[tone]?.bg ?? 'bg-slate-100 dark:bg-slate-800', toneIcon[tone]?.text ?? 'text-slate-600 dark:text-slate-300']"
                >
                    <i :class="toneIcon[tone]?.icon ?? 'fa-solid fa-circle-question'"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h2>
                    <p class="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{{ message }}</p>
                </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <SecondaryButton @click="close">{{ cancelLabel }}</SecondaryButton>
                <DangerButton v-if="tone === 'danger'" @click="confirm">{{ confirmLabel }}</DangerButton>
                <PrimaryButton v-else @click="confirm">{{ confirmLabel }}</PrimaryButton>
            </div>
        </div>
    </Modal>
</template>
