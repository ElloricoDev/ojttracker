<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, Link, useForm } from '@inertiajs/vue3';

const props = defineProps({
    companies: Array,
});

const form = useForm({
    name: '',
    email: '',
    password: '',
    company_id: '',
    position: '',
    contact_no: '',
});

const submit = () => {
    form.post(route('supervisors.store'));
};
</script>

<template>
    <Head title="👤 Create Supervisor" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <Link :href="route('supervisors.index')" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </Link>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-id-badge text-base text-slate-400"></i>
                    Create Supervisor
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body space-y-4">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <InputLabel for="name" value="Name" />
                            <input id="name" v-model="form.name" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                            <InputError class="mt-2" :message="form.errors.name" />
                        </div>
                        <div>
                            <InputLabel for="email" value="Email" />
                            <input id="email" v-model="form.email" type="email" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                            <InputError class="mt-2" :message="form.errors.email" />
                        </div>
                        <div>
                            <InputLabel for="password" value="Password" />
                            <input id="password" v-model="form.password" type="password" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                            <InputError class="mt-2" :message="form.errors.password" />
                        </div>
                        <div>
                            <InputLabel for="company_id" value="Company" />
                            <select id="company_id" v-model="form.company_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                                <option value="">Select company</option>
                                <option v-for="company in props.companies" :key="company.id" :value="company.id">{{ company.name }}</option>
                            </select>
                            <InputError class="mt-2" :message="form.errors.company_id" />
                        </div>
                        <div>
                            <InputLabel for="position" value="Position" />
                            <input id="position" v-model="form.position" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                            <InputError class="mt-2" :message="form.errors.position" />
                        </div>
                        <div>
                            <InputLabel for="contact_no" value="Contact No" />
                            <input id="contact_no" v-model="form.contact_no" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                            <InputError class="mt-2" :message="form.errors.contact_no" />
                        </div>
                    </div>

                    <PrimaryButton :disabled="form.processing">
                        <span class="inline-flex items-center gap-2">
                            <i class="fa-regular fa-floppy-disk text-xs"></i>
                            Save Supervisor
                        </span>
                    </PrimaryButton>
        </form>
    </AuthenticatedLayout>
</template>
