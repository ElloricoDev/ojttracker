<script setup>
import { Head, Link } from '@inertiajs/vue3';

defineProps({
    canLogin: {
        type: Boolean,
    },
    canRegister: {
        type: Boolean,
    },
});
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-900">
        <Head title="OJT Tracker">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
                href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        </Head>

        <div class="relative overflow-hidden">
            <div
                class="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_circle_at_12%_10%,#DCFCE7_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,#FEF3C7_0%,transparent_40%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)]"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(90deg,rgba(15,23,42,0.12)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:48px_48px]"
            ></div>

            <div class="relative mx-auto max-w-6xl px-6 py-10 lg:px-10">
                <header class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <span class="text-lg font-semibold" style="font-family: 'Space Grotesk', sans-serif;">OJ</span>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">OJT Tracker</p>
                            <p class="text-xs text-slate-600" style="font-family: 'Manrope', sans-serif;">On-the-job training management</p>
                        </div>
                    </div>

                    <nav v-if="canLogin" class="flex flex-wrap items-center gap-3 text-sm font-semibold">
                        <Link
                            v-if="$page.props.auth.user"
                            :href="route('dashboard')"
                            class="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Dashboard
                        </Link>
                        <template v-else>
                            <Link
                                :href="route('login')"
                                class="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Log in
                            </Link>
                            <Link
                                v-if="canRegister"
                                :href="route('register')"
                                class="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
                            >
                                Register
                            </Link>
                        </template>
                    </nav>
                </header>

                <section class="mt-14 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div class="space-y-6">
                        <span class="inline-flex items-center rounded-full border border-emerald-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                            OJT Operations
                        </span>
                        <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl" style="font-family: 'Space Grotesk', sans-serif;">
                            Manage placements, attendance, and evaluations without the chaos.
                        </h1>
                        <p class="max-w-xl text-base text-slate-600 sm:text-lg" style="font-family: 'Manrope', sans-serif;">
                            OJT Tracker keeps coordinators, advisers, supervisors, and trainees aligned with a single source of truth for hours, reports, and completion status.
                        </p>

                        <div class="flex flex-wrap gap-3 text-sm font-semibold">
                            <Link
                                v-if="canRegister"
                                :href="route('register')"
                                class="rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow-sm transition hover:bg-emerald-500"
                            >
                                Start tracking
                            </Link>
                            <Link
                                v-if="canLogin"
                                :href="route('login')"
                                class="rounded-full border border-slate-300 bg-white/80 px-5 py-2.5 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Sign in
                            </Link>
                        </div>

                        <div class="grid gap-4 sm:grid-cols-3">
                            <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approvals</p>
                                <p class="mt-2 text-xl font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">24h</p>
                                <p class="text-xs text-slate-600" style="font-family: 'Manrope', sans-serif;">Typical turnaround</p>
                            </div>
                            <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reports</p>
                                <p class="mt-2 text-xl font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Daily</p>
                                <p class="text-xs text-slate-600" style="font-family: 'Manrope', sans-serif;">Progress visibility</p>
                            </div>
                            <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Docs</p>
                                <p class="mt-2 text-xl font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Central</p>
                                <p class="text-xs text-slate-600" style="font-family: 'Manrope', sans-serif;">MOA to completion</p>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur sm:p-8">
                        <h2 class="text-xl font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Built for every role</h2>
                        <p class="mt-2 text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">
                            Each role sees a tailored dashboard with what matters most.
                        </p>
                        <div class="mt-6 grid gap-4">
                            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm">
                                <span class="font-semibold text-slate-900">OJT Coordinator</span>
                                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Approvals</span>
                            </div>
                            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm">
                                <span class="font-semibold text-slate-900">Faculty Adviser</span>
                                <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Reviews</span>
                            </div>
                            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm">
                                <span class="font-semibold text-slate-900">Company Supervisor</span>
                                <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Validation</span>
                            </div>
                            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm">
                                <span class="font-semibold text-slate-900">Student / Trainee</span>
                                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Logs</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="mt-16 grid gap-6 md:grid-cols-3">
                    <div class="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                            <i class="fa-solid fa-briefcase text-lg"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Placement workflow</h3>
                        <p class="mt-2 text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">
                            From request to approval, every step is tracked with audit-ready status changes.
                        </p>
                    </div>
                    <div class="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                            <i class="fa-regular fa-calendar-check text-lg"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Attendance with approvals</h3>
                        <p class="mt-2 text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">
                            Time in/out is computed, verified, and tied to required hours automatically.
                        </p>
                    </div>
                    <div class="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                            <i class="fa-regular fa-star text-lg"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">Evaluation insights</h3>
                        <p class="mt-2 text-sm text-slate-600" style="font-family: 'Manrope', sans-serif;">
                            Midterm and final assessments are stored with criteria and score history.
                        </p>
                    </div>
                </section>

                <footer class="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-6 text-xs text-slate-500" style="font-family: 'Manrope', sans-serif;">
                    <span>OJT Tracker. Built for reliable OJT compliance.</span>
                    <span>Secure, auditable, and role-aware by design.</span>
                </footer>
            </div>
        </div>
    </div>
</template>
