<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, router, useForm } from '@inertiajs/vue3';
import { computed, ref } from 'vue';

const props = defineProps({
    placement: Object,
    companies: Array,
    supervisors: Array,
    advisers: Array,
});

const initialFormData = {
    company_id: props.placement.company_id,
    supervisor_id: props.placement.supervisor_id || '',
    adviser_id: props.placement.adviser_id || '',
    required_hours: props.placement.required_hours,
    start_date: props.placement.start_date,
    end_date: props.placement.end_date,
    status: props.placement.status,
};

const form = useForm({ ...initialFormData });

const showBackConfirm = ref(false);

const normalizeFormData = (data) => ({
    ...data,
    company_id: String(data.company_id ?? ''),
    supervisor_id: String(data.supervisor_id ?? ''),
    adviser_id: String(data.adviser_id ?? ''),
    required_hours: String(data.required_hours ?? ''),
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
    form.patch(route('placements.update', props.placement.id));
};
</script>

<template>
    <Head title="💼 Edit Placement" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900" @click="requestBack">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </button>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-pen-to-square text-sm text-slate-400"></i>
                    Edit Placement
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body space-y-4">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <InputLabel for="company" value="Company" />
                            <select id="company" v-model="form.company_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                                <option value="">Select company</option>
                                <option v-for="company in props.companies" :key="company.id" :value="company.id">{{ company.name }}</option>
                            </select>
                            <InputError class="mt-2" :message="form.errors.company_id" />
                        </div>

                        <div>
                            <InputLabel for="supervisor" value="Supervisor" />
                            <select id="supervisor" v-model="form.supervisor_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                                <option value="">Select supervisor</option>
                                <option v-for="supervisor in props.supervisors" :key="supervisor.id" :value="supervisor.id">{{ supervisor.user?.name }}</option>
                            </select>
                            <InputError class="mt-2" :message="form.errors.supervisor_id" />
                        </div>

                        <div>
                            <InputLabel for="adviser" value="Adviser" />
                            <select id="adviser" v-model="form.adviser_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                                <option value="">Select adviser</option>
                                <option v-for="adviser in props.advisers" :key="adviser.id" :value="adviser.id">{{ adviser.user?.name }}</option>
                            </select>
                            <InputError class="mt-2" :message="form.errors.adviser_id" />
                        </div>

                        <div>
                            <InputLabel for="required_hours" value="Required Hours" />
                            <input id="required_hours" v-model="form.required_hours" type="number" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                            <InputError class="mt-2" :message="form.errors.required_hours" />
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

                        <div>
                            <InputLabel for="status" value="Status" />
                            <select id="status" v-model="form.status" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <InputError class="mt-2" :message="form.errors.status" />
                        </div>
                    </div>

                    <PrimaryButton :disabled="form.processing">
                        <i class="fa-solid fa-rotate text-sm mr-2"></i>
                        Update Placement
                    </PrimaryButton>
        </form>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showBackConfirm"
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirm-label="Discard"
        cancel-label="Stay"
        tone="warning"
        @confirm="confirmBack"
        @close="closeBack"
    />
</template>
