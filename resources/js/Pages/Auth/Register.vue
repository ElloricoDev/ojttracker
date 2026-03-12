<script setup>
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import TextInput from '@/Components/TextInput.vue';
import { Head, Link, useForm } from '@inertiajs/vue3';

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

const submit = () => {
    form.post(route('register'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
};
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-900">
        <Head title="🔐 Register">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
                href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        </Head>

        <div class="relative min-h-screen overflow-hidden">
            <div
                class="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_20%,#E0F2FE_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,#FEF3C7_0%,transparent_40%),linear-gradient(180deg,#F8FAFC_0%,#ECFEFF_100%)]"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(120deg,rgba(15,23,42,0.2)_1px,transparent_1px),linear-gradient(30deg,rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:64px_64px]"
            ></div>

            <div class="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 lg:px-10">
                <div class="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                    <div class="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl backdrop-blur sm:p-8">
                        <div class="mb-6 space-y-2">
                            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">Create account</p>
                            <h2 class="text-2xl font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Get started</h2>
                            <p class="text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">
                                Register a new OJT account and start tracking your placement.
                            </p>
                        </div>

                        <form @submit.prevent="submit" class="space-y-5">
                            <div>
                                <InputLabel for="name" value="Full name" class="text-slate-700" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-cyan-400 focus:ring-cyan-400"
                                    v-model="form.name"
                                    required
                                    autofocus
                                    autocomplete="name"
                                />
                                <InputError class="mt-2" :message="form.errors.name" />
                            </div>

                            <div>
                                <InputLabel for="email" value="Institutional email" class="text-slate-700" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-cyan-400 focus:ring-cyan-400"
                                    v-model="form.email"
                                    required
                                    autocomplete="username"
                                />
                                <InputError class="mt-2" :message="form.errors.email" />
                            </div>

                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel for="password" value="Password" class="text-slate-700" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-cyan-400 focus:ring-cyan-400"
                                        v-model="form.password"
                                        required
                                        autocomplete="new-password"
                                    />
                                    <InputError class="mt-2" :message="form.errors.password" />
                                </div>

                                <div>
                                    <InputLabel for="password_confirmation" value="Confirm password" class="text-slate-700" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-cyan-400 focus:ring-cyan-400"
                                        v-model="form.password_confirmation"
                                        required
                                        autocomplete="new-password"
                                    />
                                    <InputError class="mt-2" :message="form.errors.password_confirmation" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                class="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/40 disabled:cursor-not-allowed disabled:opacity-60"
                                :disabled="form.processing"
                            >
                                Create account
                            </button>

                            <p class="text-center text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">
                                Already registered?
                                <Link :href="route('login')" class="font-semibold text-cyan-700 hover:text-cyan-600">
                                    Log in
                                </Link>
                            </p>
                        </form>
                    </div>

                    <div class="space-y-7">
                        <div class="space-y-3">
                            <span class="inline-flex items-center rounded-full border border-cyan-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                                For trainees and staff
                            </span>
                            <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl" style="font-family: 'Space Grotesk', sans-serif;">
                                Build a complete OJT record with clarity.
                            </h1>
                            <p class="max-w-xl text-base text-slate-600 sm:text-lg" style="font-family: 'Manrope', sans-serif;">
                                Log attendance, submit daily reports, and keep evaluations organized across every placement.
                            </p>
                        </div>

                        <div class="grid gap-4 sm:grid-cols-2">
                            <div class="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                                <p class="text-sm font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Guided workflows</p>
                                <p class="mt-2 text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">Each role sees exactly what to approve, review, or submit.</p>
                            </div>
                            <div class="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                                <p class="text-sm font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Progress tracking</p>
                                <p class="mt-2 text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">Stay on top of required hours and completion status.</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">
                            <div class="h-2 w-2 rounded-full bg-cyan-500"></div>
                            Secure access across coordinator, adviser, and supervisor roles
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
