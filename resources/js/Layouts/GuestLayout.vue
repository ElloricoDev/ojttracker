<script setup>
import { onMounted, ref } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import ApplicationLogo from '@/Components/ApplicationLogo.vue';

const darkMode = ref(false);

const toggleDarkMode = () => {
    darkMode.value = !darkMode.value;
    document.documentElement.classList.toggle('dark', darkMode.value);

    try {
        localStorage.setItem('ojt_dark_mode', darkMode.value ? '1' : '0');
    } catch {
        // ignore storage failures
    }
};

onMounted(() => {
    darkMode.value = document.documentElement.classList.contains('dark');
});
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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
                class="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_12%_10%,#DCFCE7_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,#FEF3C7_0%,transparent_40%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)] dark:hidden"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(120deg,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(30deg,rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:56px_56px] dark:hidden"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(900px_circle_at_12%_10%,#34D39926_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,#FACC1533_0%,transparent_40%),linear-gradient(180deg,#020617_0%,#0F172A_100%)]"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 hidden opacity-[0.12] [background-image:linear-gradient(120deg,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(30deg,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:56px_56px] dark:block"
            ></div>

            <div class="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12 lg:px-10">
                <div class="w-full rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                    <div class="mb-6 flex items-center justify-between gap-3">
                        <Link href="/" class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                <ApplicationLogo class="h-6 w-6 fill-current" />
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-slate-900 dark:text-slate-100" style="font-family: 'Space Grotesk', sans-serif;">OJT Tracker</div>
                                <div class="text-xs text-slate-500" style="font-family: 'Manrope', sans-serif;">On-the-job training</div>
                            </div>
                        </Link>
                        <button
                            type="button"
                            @click="toggleDarkMode"
                            :title="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
                            class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white"
                        >
                            <i :class="darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" class="text-sm"></i>
                        </button>
                    </div>
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>
