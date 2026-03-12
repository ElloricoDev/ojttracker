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
    work_date: '',
    accomplishments: '',
    hours_rendered: '',
};

const form = useForm({ ...initialFormData });

const showBackConfirm = ref(false);

const normalizeFormData = (data) => ({
    ...data,
    placement_id: String(data.placement_id ?? ''),
    hours_rendered: String(data.hours_rendered ?? ''),
});

const hasChanges = computed(() =>
    JSON.stringify(normalizeFormData(form.data())) !== JSON.stringify(normalizeFormData(initialFormData)),
);

const goBack = () => {
    router.get(route('daily-reports.index'), {
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

const submit = () => {
    form.post(route('daily-reports.store'));
};
</script>

<template>
    <Head title="📝 Create Daily Report" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900" @click="requestBack">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </button>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-clipboard text-base text-slate-400"></i>
                    Create Daily Report
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body">
            <div class="grid gap-4 md:grid-cols-4">
                <div class="md:col-span-2">
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
                    <InputLabel for="work_date" value="Work Date" />
                    <input id="work_date" v-model="form.work_date" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.work_date" />
                </div>
                <div>
                    <InputLabel for="hours_rendered" value="Hours Rendered" />
                    <input id="hours_rendered" v-model="form.hours_rendered" type="number" step="0.25" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.hours_rendered" />
                </div>
            </div>

            <div class="mt-4">
                <InputLabel for="accomplishments" value="Accomplishments" />
                <textarea id="accomplishments" v-model="form.accomplishments" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" rows="4" />
                <InputError class="mt-2" :message="form.errors.accomplishments" />
            </div>

            <div class="mt-4">
                <PrimaryButton :disabled="form.processing">
                    <i class="fa-regular fa-paper-plane mr-2 text-xs"></i>
                    Submit Report
                </PrimaryButton>
            </div>
        </form>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showBackConfirm"
        title="Discard report?"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirm-label="Discard"
        cancel-label="Stay"
        tone="warning"
        @confirm="confirmBack"
        @close="closeBack"
    />
</template>
