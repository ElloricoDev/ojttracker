<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, router, useForm } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import { formatHours } from '@/utils/formatters';

const props = defineProps({
    student: Object,
    companies: Array,
    batches: Array,
});

const initialFormData = {
    company_id: '',
    ojt_batch_id: props.student?.ojt_batch_id || '',
    start_date: '',
    end_date: '',
};

const form = useForm({ ...initialFormData });
const showBackConfirm = ref(false);

const normalizeFormData = (data) => ({
    ...data,
    company_id: String(data.company_id ?? ''),
    ojt_batch_id: String(data.ojt_batch_id ?? ''),
});

const hasChanges = computed(() =>
    JSON.stringify(normalizeFormData(form.data())) !== JSON.stringify(normalizeFormData(initialFormData)),
);

const goBack = () => {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }
    router.get(route('placements.index'));
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
    form.post(route('placements.request.store'));
};
</script>

<template>
    <Head title="💼 Request Placement" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900" @click="requestBack">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </button>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-solid fa-briefcase text-base text-slate-400"></i>
                    Request Placement
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
                <div class="md:col-span-2">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        <div class="font-semibold text-slate-800">{{ props.student?.name || 'Student' }}</div>
                        <div class="mt-1">Required hours: {{ formatHours(props.student?.required_hours || 0) }}</div>
                    </div>
                </div>

                <div>
                    <InputLabel for="company" value="Company" />
                    <select id="company" v-model="form.company_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="">Select company</option>
                        <option v-for="company in props.companies" :key="company.id" :value="company.id">{{ company.name }}</option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.company_id" />
                </div>

                <div>
                    <InputLabel for="batch" value="OJT Batch" />
                    <select id="batch" v-model="form.ojt_batch_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="">Select batch</option>
                        <option v-for="batch in props.batches" :key="batch.id" :value="batch.id">{{ batch.name }}</option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.ojt_batch_id" />
                </div>

                <div>
                    <InputLabel for="start_date" value="Start Date" />
                    <input id="start_date" v-model="form.start_date" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.start_date" />
                </div>

                <div>
                    <InputLabel for="end_date" value="End Date" />
                    <input id="end_date" v-model="form.end_date" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.end_date" />
                </div>
            </div>

            <PrimaryButton :disabled="form.processing">
                <i class="fa-regular fa-paper-plane mr-2 text-sm"></i>
                Submit Request
            </PrimaryButton>
        </form>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showBackConfirm"
        title="Discard request?"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirm-label="Discard"
        cancel-label="Stay"
        tone="warning"
        @confirm="confirmBack"
        @close="closeBack"
    />
</template>
