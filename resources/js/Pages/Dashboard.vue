<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import { Head, Link } from '@inertiajs/vue3';
import { formatDate, formatHours } from '@/utils/formatters';

defineProps({
    role: {
        type: String,
        required: true,
    },
    metrics: {
        type: Object,
        required: true,
    },
    recentPlacements: {
        type: Array,
        required: true,
    },
    roleInsights: {
        type: Object,
        required: true,
    },
    studentPlacement: {
        type: Object,
        default: null,
    },
});
</script>

<template>
    <Head title="Dashboard" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                <i class="fa-solid fa-gauge-high text-base text-slate-400"></i>
                OJT Dashboard
            </h2>
        </template>

        <div class="space-y-6">
            <div v-if="role !== 'student'" class="grid gap-4 md:grid-cols-5">
                <div class="card-sm card-sm-body border-l-4 border-l-slate-300">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-briefcase text-xs text-slate-400"></i>
                        Total Placements
                    </p>
                    <p class="mt-2 text-3xl font-bold text-slate-900">{{ metrics.totalPlacements }}</p>
                </div>
                <div class="card-sm card-sm-body border-l-4 border-l-emerald-400">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-circle-check text-xs text-emerald-500"></i>
                        Active
                    </p>
                    <p class="mt-2 text-3xl font-bold text-emerald-700">{{ metrics.activePlacements }}</p>
                </div>
                <div class="card-sm card-sm-body border-l-4 border-l-amber-400">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-clock text-xs text-amber-500"></i>
                        Pending
                    </p>
                    <p class="mt-2 text-3xl font-bold text-amber-700">{{ metrics.pendingPlacements }}</p>
                </div>
                <div class="card-sm card-sm-body border-l-4 border-l-rose-400">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-regular fa-file-lines text-xs text-rose-500"></i>
                        Pending Reports
                    </p>
                    <p class="mt-2 text-3xl font-bold text-rose-700">{{ metrics.pendingReports }}</p>
                </div>
                <div class="card-sm card-sm-body border-l-4 border-l-sky-400">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-hourglass-half text-xs text-sky-500"></i>
                        Hours Rendered
                    </p>
                    <p class="mt-2 text-3xl font-bold text-sky-700">{{ formatHours(metrics.hoursRendered) }}</p>
                </div>
            </div>

            <div v-if="role === 'student'" class="grid gap-4 lg:grid-cols-3">
                <div class="card card-body lg:col-span-2">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-solid fa-graduation-cap text-sm text-slate-400"></i>
                        My Placement
                    </h3>
                    <div v-if="studentPlacement" class="mt-4 space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div class="text-sm text-slate-500">Company</div>
                                <div class="text-base font-semibold text-slate-900">{{ studentPlacement.company || 'Unassigned' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-slate-500">Status</div>
                                <div class="text-base font-semibold capitalize text-slate-900">{{ studentPlacement.status }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-slate-500">Start Date</div>
                                <div class="text-base font-semibold text-slate-900">{{ formatDate(studentPlacement.start_date) }}</div>
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center justify-between text-sm text-slate-600">
                                <span>Progress</span>
                                <span>{{ studentPlacement.progress }}%</span>
                            </div>
                            <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${studentPlacement.progress}%` }"></div>
                            </div>
                            <div class="mt-2 text-sm text-slate-500">
                                {{ formatHours(studentPlacement.hours_rendered) }} of {{ formatHours(studentPlacement.required_hours) }} hours rendered
                            </div>
                        </div>
                    </div>
                    <div v-else class="mt-4 text-sm text-slate-500">No placement assigned yet.</div>
                </div>
                <div class="card card-body">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-regular fa-clipboard text-sm text-slate-400"></i>
                        Next Actions
                    </h3>
                    <ul class="mt-4 space-y-2 text-sm text-slate-600">
                        <li class="flex items-center gap-2">
                            <i class="fa-solid fa-clock text-xs text-amber-500"></i>
                            Submit daily reports on time
                        </li>
                        <li class="flex items-center gap-2">
                            <i class="fa-regular fa-file-lines text-xs text-slate-400"></i>
                            Upload required documents
                        </li>
                        <li class="flex items-center gap-2">
                            <i class="fa-solid fa-list-check text-xs text-emerald-500"></i>
                            Track hours toward completion
                        </li>
                    </ul>
                </div>
            </div>

            <div v-if="role !== 'student'" class="grid gap-4 md:grid-cols-4">
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-regular fa-calendar-check text-xs text-slate-400"></i>
                        Pending Attendance
                    </p>
                    <p class="mt-2 text-3xl font-bold text-slate-900">{{ roleInsights.pendingAttendance }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-regular fa-file-lines text-xs text-rose-500"></i>
                        Pending Reports
                    </p>
                    <p class="mt-2 text-3xl font-bold text-rose-700">{{ roleInsights.pendingReports }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-paperclip text-xs text-amber-500"></i>
                        Pending Documents
                    </p>
                    <p class="mt-2 text-3xl font-bold text-amber-700">{{ roleInsights.pendingDocuments }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-regular fa-star text-xs text-emerald-500"></i>
                        Pending Evaluations
                    </p>
                    <p class="mt-2 text-3xl font-bold text-emerald-700">{{ roleInsights.pendingEvaluations }}</p>
                </div>
            </div>

            <div v-if="role !== 'student'" class="card card-body">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-regular fa-folder-open text-sm text-slate-400"></i>
                        Recent Placements
                    </h3>
                    <Link :href="route('placements.index')" class="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-600">
                        View all
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                    </Link>
                </div>
                <div class="overflow-x-auto">
                    <table class="table-base">
                        <thead>
                            <tr class="table-head">
                                <th class="px-2 py-2">Student</th>
                                <th class="px-2 py-2">Company</th>
                                <th class="px-2 py-2">Status</th>
                                <th class="px-2 py-2">Start Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="placement in recentPlacements" :key="placement.id" class="table-row">
                                <td class="px-2 py-2">{{ placement.student }}</td>
                                <td class="px-2 py-2">{{ placement.company }}</td>
                                <td class="px-2 py-2"><StatusBadge :status="placement.status" /></td>
                                <td class="px-2 py-2">{{ formatDate(placement.start_date) }}</td>
                            </tr>
                            <tr v-if="recentPlacements.length === 0">
                                <td colspan="4" class="px-2 py-4 text-center text-slate-500">No placements yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
