<script setup>
import Checkbox from '@/Components/Checkbox.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import TextInput from '@/Components/TextInput.vue';
import { Head, Link, useForm } from '@inertiajs/vue3';

defineProps({
    canResetPassword: {
        type: Boolean,
    },
    status: {
        type: String,
    },
});

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
    });
};
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Head title="🔐 Log in">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
                href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        </Head>

        <div class="relative min-h-screen overflow-hidden">
            <div
                class="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_12%_10%,#DCFCE7_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,#FEF3C7_0%,transparent_40%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)] dark:bg-[radial-gradient(900px_circle_at_12%_10%,rgba(16,185,129,0.18)_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,rgba(251,191,36,0.18)_0%,transparent_40%),linear-gradient(180deg,#0B1120_0%,#0F172A_100%)]"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(120deg,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(30deg,rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-[0.25] dark:[background-image:linear-gradient(120deg,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(30deg,rgba(148,163,184,0.12)_1px,transparent_1px)]"
            ></div>

            <div class="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 lg:px-10">
                <div class="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div class="space-y-8">
                        <div class="space-y-3">
                            <div class="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                                OJT Tracker
                            </div>
                            <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100" style="font-family: 'Space Grotesk', sans-serif;">
                                Keep OJT hours, reports, and evaluations on track.
                            </h1>
                            <p class="max-w-xl text-base text-slate-600 sm:text-lg dark:text-slate-300" style="font-family: 'Manrope', sans-serif;">
                                One workspace for coordinators, advisers, supervisors, and trainees. Approvals, attendance, and completion status in one place.
                            </p>
                        </div>

                        <div class="grid gap-4 sm:grid-cols-2">
                            <div class="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                                <p class="text-sm font-semibold text-slate-900 dark:text-slate-100" style="font-family: 'Space Grotesk', sans-serif;">Fast approvals</p>
                                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300" style="font-family: 'Manrope', sans-serif;">Route placements, attendance, and reports to the right reviewer automatically.</p>
                            </div>
                            <div class="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                                <p class="text-sm font-semibold text-slate-900 dark:text-slate-100" style="font-family: 'Space Grotesk', sans-serif;">Evidence ready</p>
                                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300" style="font-family: 'Manrope', sans-serif;">Store MOA, waivers, and completion docs with clear audit trails.</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300" style="font-family: 'Manrope', sans-serif;">
                            <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
                            Secure role-based access for every stakeholder
                        </div>
                    </div>

                    <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-900/70">
                        <div class="mb-6 space-y-2">
                            <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-100" style="font-family: 'Space Grotesk', sans-serif;">Log in</h2>
                            <p class="text-sm text-slate-600 dark:text-slate-300" style="font-family: 'Manrope', sans-serif;">
                                Use your institutional account to continue.
                            </p>
                        </div>

                        <div v-if="status" class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-200" style="font-family: 'Manrope', sans-serif;">
                            {{ status }}
                        </div>

                        <form @submit.prevent="submit" class="space-y-5">
                            <div>
                                <InputLabel for="email" value="Email" class="text-slate-700 dark:text-slate-200" />
                                <div class="relative mt-2">
                                    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                        <i class="fa-regular fa-envelope text-base"></i>
                                    </span>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        class="block w-full rounded-xl border-slate-200 bg-white/90 py-2.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                                        v-model="form.email"
                                        required
                                        autofocus
                                        autocomplete="username"
                                    />
                                </div>
                                <InputError class="mt-2" :message="form.errors.email" />
                            </div>

                            <div>
                                <InputLabel for="password" value="Password" class="text-slate-700 dark:text-slate-200" />
                                <div class="relative mt-2">
                                    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                        <i class="fa-solid fa-lock text-base"></i>
                                    </span>
                                    <TextInput
                                        id="password"
                                        type="password"
                                        class="block w-full rounded-xl border-slate-200 bg-white/90 py-2.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                                        v-model="form.password"
                                        required
                                        autocomplete="current-password"
                                    />
                                </div>
                                <InputError class="mt-2" :message="form.errors.password" />
                            </div>

                            <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300" style="font-family: 'Manrope', sans-serif;">
                                <label class="flex items-center gap-2">
                                    <Checkbox name="remember" v-model:checked="form.remember" />
                                    Remember me
                                </label>

                                <Link
                                    v-if="canResetPassword"
                                    :href="route('password.request')"
                                    class="font-medium text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                class="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-300/40"
                                :disabled="form.processing"
                            >
                                <i class="fa-solid fa-right-to-bracket mr-2 text-base"></i>
                                Sign in
                            </button>

                            <p class="text-center text-sm text-slate-600 dark:text-slate-300" style="font-family: 'Manrope', sans-serif;">
                                Accounts are provisioned by the administrator.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
