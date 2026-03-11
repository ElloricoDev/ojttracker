<script setup>
import { Head, Link } from '@inertiajs/vue3';
import ApplicationLogo from '@/Components/ApplicationLogo.vue';
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-900">
        <Head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
                href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        </Head>

        <div class="relative min-h-screen overflow-hidden">
            <div
                class="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_12%_10%,#DCFCE7_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,#FEF3C7_0%,transparent_40%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)]"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(120deg,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(30deg,rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:56px_56px]"
            ></div>

            <div class="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12 lg:px-10">
                <div class="w-full rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-xl backdrop-blur">
                    <div class="mb-6 flex items-center gap-3">
                        <Link href="/" class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                <ApplicationLogo class="h-6 w-6 fill-current" />
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">OJT Tracker</div>
                                <div class="text-xs text-slate-500" style="font-family: 'Manrope', sans-serif;">On-the-job training</div>
                            </div>
                        </Link>
                    </div>
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>
