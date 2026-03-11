<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, Link, useForm } from '@inertiajs/vue3';

const form = useForm({
    name: '',
    address: '',
    contact_person: '',
    email: '',
    phone: '',
    moa_start_at: '',
    moa_end_at: '',
    is_active: true,
});

const submit = () => {
    form.post(route('companies.store'));
};
</script>

<template>
    <Head title="Create Company" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <Link :href="route('companies.index')" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </Link>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-building text-base text-slate-400"></i>
                    Create Company
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
                <div>
                    <InputLabel for="name" value="Company Name" />
                    <input id="name" v-model="form.name" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.name" />
                </div>
                <div>
                    <InputLabel for="contact_person" value="Contact Person" />
                    <input id="contact_person" v-model="form.contact_person" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.contact_person" />
                </div>
                <div>
                    <InputLabel for="email" value="Email" />
                    <input id="email" v-model="form.email" type="email" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.email" />
                </div>
                <div>
                    <InputLabel for="phone" value="Phone" />
                    <input id="phone" v-model="form.phone" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.phone" />
                </div>
                <div class="md:col-span-2">
                    <InputLabel for="address" value="Address" />
                    <input id="address" v-model="form.address" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.address" />
                </div>
                <div>
                    <InputLabel for="moa_start_at" value="MOA Start" />
                    <input id="moa_start_at" v-model="form.moa_start_at" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.moa_start_at" />
                </div>
                <div>
                    <InputLabel for="moa_end_at" value="MOA End" />
                    <input id="moa_end_at" v-model="form.moa_end_at" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.moa_end_at" />
                </div>
                <div class="flex items-center gap-2">
                    <input id="is_active" v-model="form.is_active" type="checkbox" class="rounded border-slate-300 text-emerald-600 shadow-sm focus:ring-emerald-500" />
                    <label for="is_active" class="text-sm font-medium text-slate-700">Active</label>
                </div>
            </div>

            <PrimaryButton :disabled="form.processing">
                <span class="inline-flex items-center gap-2">
                    <i class="fa-regular fa-floppy-disk text-xs"></i>
                    Save Company
                </span>
            </PrimaryButton>
        </form>
    </AuthenticatedLayout>
</template>
