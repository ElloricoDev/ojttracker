<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, Link, useForm } from '@inertiajs/vue3';

const props = defineProps({
    batch: Object,
});

const form = useForm({
    name: props.batch.name || '',
    school_year: props.batch.school_year || '',
    semester: props.batch.semester || '',
    start_date: props.batch.start_date || '',
    end_date: props.batch.end_date || '',
});

const submit = () => {
    form.patch(route('batches.update', props.batch.id));
};
</script>

<template>
    <Head title="🗂️ Edit Batch" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <Link :href="route('batches.index')" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </Link>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-calendar text-base text-slate-400"></i>
                    Edit Batch
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
                <div class="md:col-span-2">
                    <InputLabel for="name" value="Batch Name" />
                    <input id="name" v-model="form.name" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.name" />
                </div>
                <div>
                    <InputLabel for="school_year" value="School Year" />
                    <input id="school_year" v-model="form.school_year" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.school_year" />
                </div>
                <div>
                    <InputLabel for="semester" value="Semester" />
                    <input id="semester" v-model="form.semester" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.semester" />
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
                <span class="inline-flex items-center gap-2">
                    <i class="fa-regular fa-floppy-disk text-xs"></i>
                    Update Batch
                </span>
            </PrimaryButton>
        </form>
    </AuthenticatedLayout>
</template>
