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
</script>

<template>
    <Modal :show="show" @close="close">
        <div class="p-6">
            <h2 class="text-lg font-medium text-slate-900">{{ title }}</h2>
            <p class="mt-2 text-sm text-slate-600">{{ message }}</p>
            <div class="mt-6 flex justify-end gap-3">
                <SecondaryButton @click="close">{{ cancelLabel }}</SecondaryButton>
                <DangerButton v-if="tone === 'danger'" @click="confirm">{{ confirmLabel }}</DangerButton>
                <PrimaryButton v-else @click="confirm">{{ confirmLabel }}</PrimaryButton>
            </div>
        </div>
    </Modal>
</template>
