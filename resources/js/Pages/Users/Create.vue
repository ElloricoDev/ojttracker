<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { Head, Link, useForm } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
    roles: Array,
});

const defaultRole = props.roles?.[0] || 'coordinator';

const form = useForm({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    status: 'active',
    department: '',
});

const isAdviser = computed(() => form.role === 'adviser');

const submit = () => {
    form.post(route('users.store'));
};
</script>

<template>
    <Head title="👥 Create User" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <Link :href="route('users.index')" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </Link>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-solid fa-user-plus text-base text-slate-400"></i>
                    Create User
                </h2>
            </div>
        </template>

        <form @submit.prevent="submit" class="card card-body space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
                <div>
                    <InputLabel for="name" value="Full Name" />
                    <input id="name" v-model="form.name" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.name" />
                </div>
                <div>
                    <InputLabel for="email" value="Email" />
                    <input id="email" v-model="form.email" type="email" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.email" />
                </div>
                <div>
                    <InputLabel for="password" value="Temporary Password" />
                    <input id="password" v-model="form.password" type="password" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.password" />
                </div>
                <div>
                    <InputLabel for="role" value="Role" />
                    <select id="role" v-model="form.role" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option v-for="role in props.roles" :key="role" :value="role">{{ role }}</option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.role" />
                </div>
                <div>
                    <InputLabel for="status" value="Status" />
                    <select id="status" v-model="form.status" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.status" />
                </div>
            </div>

            <div v-if="isAdviser" class="grid gap-4 md:grid-cols-2">
                <div>
                    <InputLabel for="department" value="Department" />
                    <input id="department" v-model="form.department" type="text" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.department" />
                </div>
            </div>

            <PrimaryButton :disabled="form.processing">
                <span class="inline-flex items-center gap-2">
                    <i class="fa-regular fa-floppy-disk text-xs"></i>
                    Save User
                </span>
            </PrimaryButton>
        </form>
    </AuthenticatedLayout>
</template>
