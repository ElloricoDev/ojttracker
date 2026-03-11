<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, router, useForm } from '@inertiajs/vue3';
import { computed, ref } from 'vue';

const props = defineProps({
    placements: Array,
    selectedPlacementId: Number,
});

const initialFormData = {
    placement_id: props.selectedPlacementId || '',
    document_type: '',
    document_file: null,
};

const form = useForm({ ...initialFormData });

const submit = () => {
    form.post(route('documents.store'), {
        forceFormData: true,
    });
};

const showBackConfirm = ref(false);

const normalizeFormData = (data) => ({
    ...data,
    placement_id: String(data.placement_id ?? ''),
    document_file: data.document_file ? 'has_file' : '',
});

const hasChanges = computed(() =>
    JSON.stringify(normalizeFormData(form.data())) !== JSON.stringify(normalizeFormData(initialFormData)),
);

const goBack = () => {
    router.get(route('documents.index'), {
        placement_id: form.placement_id || undefined,
    });
};

const requestBack = () => {
    if (hasChanges.value) {
        showBackConfirm.value = true;
        return;
    }
    goBack();
};

const confirmBack = () => {
    showBackConfirm.value = false;
    goBack();
};

const closeBack = () => {
    showBackConfirm.value = false;
};
</script>

<template>
    <Head title="Upload Document" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900" @click="requestBack">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </button>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-file-lines text-base text-slate-400"></i>
                    Upload Document
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body">
            <div class="grid gap-4 md:grid-cols-3">
                <div>
                    <InputLabel for="placement" value="Placement" />
                    <select id="placement" v-model="form.placement_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="">Select placement</option>
                        <option v-for="placement in props.placements" :key="placement.id" :value="placement.id">
                            {{ placement.student?.user?.name }} - {{ placement.company?.name }}
                        </option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.placement_id" />
                </div>
                <div>
                    <InputLabel for="document_type" value="Document Type" />
                    <input id="document_type" v-model="form.document_type" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" placeholder="MOA, waiver, completion" />
                    <InputError class="mt-2" :message="form.errors.document_type" />
                </div>
                <div>
                    <InputLabel for="document_file" value="File" />
                    <input id="document_file" type="file" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" @change="(event) => form.document_file = event.target.files[0]" />
                    <InputError class="mt-2" :message="form.errors.document_file" />
                </div>
            </div>

            <div class="mt-4">
                <PrimaryButton :disabled="form.processing">
                    <i class="fa-solid fa-upload mr-2 text-xs"></i>
                    Upload Document
                </PrimaryButton>
            </div>
        </form>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showBackConfirm"
        title="Discard upload?"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirm-label="Discard"
        cancel-label="Stay"
        tone="warning"
        @confirm="confirmBack"
        @close="closeBack"
    />
</template>
