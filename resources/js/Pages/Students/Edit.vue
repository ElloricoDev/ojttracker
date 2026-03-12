<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, Link, useForm } from '@inertiajs/vue3';

const props = defineProps({
    student: Object,
    batches: Array,
});

const form = useForm({
    student_no: props.student.student_no || '',
    course: props.student.course || '',
    year_level: props.student.year_level || '',
    required_hours: props.student.required_hours || 486,
    ojt_batch_id: props.student.ojt_batch_id || '',
    contact_no: props.student.contact_no || '',
    address: props.student.address || '',
    emergency_contact_name: props.student.emergency_contact_name || '',
    emergency_contact_no: props.student.emergency_contact_no || '',
});

const submit = () => {
    form.patch(route('students.update', props.student.id));
};
</script>

<template>
    <Head title="🎓 Edit Student" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <Link :href="route('students.index')" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </Link>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-pen-to-square text-base text-slate-400"></i>
                    Edit Student
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
                <div>
                    <InputLabel for="student_no" value="Student No" />
                    <input id="student_no" v-model="form.student_no" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.student_no" />
                </div>
                <div>
                    <InputLabel for="course" value="Course" />
                    <input id="course" v-model="form.course" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.course" />
                </div>
                <div>
                    <InputLabel for="year_level" value="Year Level" />
                    <input id="year_level" v-model="form.year_level" type="number" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.year_level" />
                </div>
                <div>
                    <InputLabel for="required_hours" value="Required Hours" />
                    <input id="required_hours" v-model="form.required_hours" type="number" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.required_hours" />
                </div>
                <div>
                    <InputLabel for="ojt_batch_id" value="OJT Batch" />
                    <select id="ojt_batch_id" v-model="form.ojt_batch_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="">Select batch</option>
                        <option v-for="batch in props.batches" :key="batch.id" :value="batch.id">{{ batch.name }}</option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.ojt_batch_id" />
                </div>
                <div>
                    <InputLabel for="contact_no" value="Contact No" />
                    <input id="contact_no" v-model="form.contact_no" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.contact_no" />
                </div>
                <div class="md:col-span-2">
                    <InputLabel for="address" value="Address" />
                    <input id="address" v-model="form.address" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.address" />
                </div>
                <div>
                    <InputLabel for="emergency_contact_name" value="Emergency Contact Name" />
                    <input id="emergency_contact_name" v-model="form.emergency_contact_name" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.emergency_contact_name" />
                </div>
                <div>
                    <InputLabel for="emergency_contact_no" value="Emergency Contact No" />
                    <input id="emergency_contact_no" v-model="form.emergency_contact_no" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.emergency_contact_no" />
                </div>
            </div>

            <PrimaryButton :disabled="form.processing">
                <span class="inline-flex items-center gap-2">
                    <i class="fa-solid fa-check text-xs"></i>
                    Save Student
                </span>
            </PrimaryButton>
        </form>
    </AuthenticatedLayout>
</template>
