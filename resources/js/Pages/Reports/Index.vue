<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DataTable from '@/Components/DataTable.vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import { formatHours } from '@/utils/formatters';

const props = defineProps({
    stats: Object,
    perCompany: Object,
    perCourse: Object,
    analytics: Object,
    filters: Object,
});

const trendOptions = [3, 6, 12];
const companySearch = ref(props.filters?.company_search || '');
const courseSearch = ref(props.filters?.course_search || '');
const companyPerPage = ref(Number(props.filters?.company_per_page || 10));
const coursePerPage = ref(Number(props.filters?.course_per_page || 10));
const trendMonths = ref(Number(props.filters?.trend_months || props.analytics?.trendMonths || 6));

const refresh = (options = {}) => {
    router.get(route('reports.index'), {
        company_search: companySearch.value || undefined,
        course_search: courseSearch.value || undefined,
        company_per_page: companyPerPage.value || undefined,
        course_per_page: coursePerPage.value || undefined,
        trend_months: trendMonths.value || undefined,
        ...options,
    }, {
        preserveState: true,
        replace: true,
    });
};

const handleCompanySearch = (value) => {
    companySearch.value = value;
    refresh({ company_page: 1 });
};

const handleCourseSearch = (value) => {
    courseSearch.value = value;
    refresh({ course_page: 1 });
};

const handleCompanyPerPage = (value) => {
    companyPerPage.value = Number(value);
    refresh({ company_page: 1 });
};

const handleCoursePerPage = (value) => {
    coursePerPage.value = Number(value);
    refresh({ course_page: 1 });
};

const handleTrendMonthsChange = (value) => {
    trendMonths.value = Number(value) || 6;
    refresh({ company_page: 1, course_page: 1 });
};

const monthlyHours = computed(() => props.analytics?.monthlyHours ?? []);
const placementStatus = computed(() => props.analytics?.placementStatus ?? []);
const attendanceStatus = computed(() => props.analytics?.attendanceStatus ?? []);
const reportStatus = computed(() => props.analytics?.reportStatus ?? []);
const topStudents = computed(() => props.analytics?.topStudents ?? []);
const perCompanyRows = computed(() => props.perCompany?.data ?? []);
const perCourseRows = computed(() => props.perCourse?.data ?? []);

const peakMonth = computed(() => {
    return monthlyHours.value.reduce((best, current) => {
        if (!best || (current?.hours ?? 0) > (best?.hours ?? 0)) {
            return current;
        }
        return best;
    }, null);
});

const barWidth = (value) => {
    const numeric = Number(value || 0);
    if (numeric <= 0) {
        return '0%';
    }
    return `${Math.max(numeric, 4)}%`;
};

const percentWidth = (value) => {
    const numeric = Number(value || 0);
    if (numeric <= 0) {
        return '0%';
    }
    return `${Math.min(100, numeric)}%`;
};

const statusPalette = {
    active: '#10b981',
    completed: '#0ea5e9',
    pending: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
    cancelled: '#f43f5e',
    submitted: '#6366f1',
    reviewed: '#14b8a6',
    verified: '#0d9488',
    inactive: '#64748b',
    draft: '#94a3b8',
    unknown: '#94a3b8',
};

const statusColor = (status) => statusPalette[status] ?? statusPalette.unknown;

const trendGraph = computed(() => {
    const points = monthlyHours.value || [];
    const width = 760;
    const height = 260;
    const padX = 46;
    const padY = 24;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const max = Math.max(...points.map((point) => Number(point.hours || 0)), 1);

    const mapped = points.map((point, index) => {
        const hours = Number(point.hours || 0);
        const x = points.length > 1
            ? padX + (index * plotW) / (points.length - 1)
            : padX + plotW / 2;
        const y = padY + (1 - hours / max) * plotH;

        return {
            ...point,
            hours,
            x,
            y,
        };
    });

    const yTicks = Array.from({ length: 5 }, (_, index) => {
        const value = ((4 - index) / 4) * max;
        const y = padY + (index / 4) * plotH;

        return {
            value,
            y,
            label: `${value.toFixed(value >= 100 ? 0 : 1)}h`,
        };
    });

    return {
        width,
        height,
        padX,
        padY,
        mapped,
        yTicks,
    };
});

const trendLinePath = computed(() => {
    const pts = trendGraph.value.mapped;
    if (!pts.length) {
        return '';
    }

    return pts
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');
});

const trendAreaPath = computed(() => {
    const { mapped, padY, height } = trendGraph.value;
    if (!mapped.length) {
        return '';
    }

    const first = mapped[0];
    const last = mapped[mapped.length - 1];
    const baseline = height - padY;
    const line = mapped
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');

    return `${line} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
});

const hoveredTrendKey = ref(null);
const activeTrendPoint = computed(() => {
    const points = trendGraph.value.mapped;
    if (!points.length) {
        return null;
    }
    return points.find((point) => point.key === hoveredTrendKey.value) || points[points.length - 1];
});

const trendChange = computed(() => {
    const points = trendGraph.value.mapped;
    if (points.length < 2) {
        return { value: 0, direction: 'flat' };
    }

    const first = Number(points[0].hours || 0);
    const last = Number(points[points.length - 1].hours || 0);

    if (first <= 0) {
        return { value: last > 0 ? 100 : 0, direction: last > 0 ? 'up' : 'flat' };
    }

    const diff = ((last - first) / first) * 100;
    return {
        value: Math.abs(Number(diff.toFixed(2))),
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
    };
});

const placementSegments = computed(() => {
    return placementStatus.value.map((row) => ({
        ...row,
        color: statusColor(row.status),
    }));
});

const placementDonut = computed(() => {
    if (!placementSegments.value.length) {
        return `conic-gradient(${statusPalette.unknown} 0deg 360deg)`;
    }

    let angle = 0;
    const slices = placementSegments.value.map((segment) => {
        const start = angle;
        const sweep = (Number(segment.percentage || 0) / 100) * 360;
        const end = start + sweep;
        angle = end;
        return `${segment.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    });

    if (angle < 360) {
        slices.push(`${statusPalette.unknown} ${angle.toFixed(2)}deg 360deg`);
    }

    return `conic-gradient(${slices.join(', ')})`;
});

const attendanceSegments = computed(() => {
    return attendanceStatus.value.map((row) => ({
        ...row,
        color: statusColor(row.status),
    }));
});

const reportMaxCount = computed(() => {
    return Math.max(
        1,
        ...reportStatus.value.map((row) => Math.max(Number(row.daily || 0), Number(row.weekly || 0))),
    );
});

const workflowBarWidth = (value) => {
    const max = reportMaxCount.value || 1;
    const numeric = Number(value || 0);
    if (numeric <= 0) {
        return '0%';
    }
    return `${Math.max((numeric / max) * 100, 4).toFixed(2)}%`;
};
</script>

<template>
    <Head title="📊 Reports & Analytics" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                <i class="fa-solid fa-chart-line text-base text-slate-400"></i>
                Reports & Analytics
            </h2>
        </template>

        <div class="space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-2">
                    <Link
                        :href="route('reports.export.company', { company_search: companySearch || undefined })"
                        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <i class="fa-solid fa-file-arrow-down text-xs"></i>
                        Export Per Company
                    </Link>
                    <Link
                        :href="route('reports.export.course', { course_search: courseSearch || undefined })"
                        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <i class="fa-solid fa-file-arrow-down text-xs"></i>
                        Export Per Course
                    </Link>
                </div>

                <div class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2">
                    <i class="fa-solid fa-calendar-days text-xs text-slate-400"></i>
                    <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Trend Range</span>
                    <select
                        :value="trendMonths"
                        class="rounded-lg border-slate-200 py-1 pl-2 pr-7 text-sm text-slate-700 shadow-none focus:border-emerald-400 focus:ring-emerald-400"
                        @change="handleTrendMonthsChange($event.target.value)"
                    >
                        <option v-for="option in trendOptions" :key="option" :value="option">
                            Last {{ option }} months
                        </option>
                    </select>
                </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-briefcase text-xs text-slate-400"></i>
                        Total Placements
                    </p>
                    <p class="mt-2 text-2xl font-bold text-slate-900">{{ props.stats.totalPlacements }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-bolt text-xs text-emerald-500"></i>
                        Active
                    </p>
                    <p class="mt-2 text-2xl font-bold text-emerald-700">{{ props.stats.activePlacements }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-circle-check text-xs text-sky-500"></i>
                        Completed
                    </p>
                    <p class="mt-2 text-2xl font-bold text-sky-700">{{ props.stats.completedPlacements }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-percent text-xs text-indigo-500"></i>
                        Completion Rate
                    </p>
                    <p class="mt-2 text-2xl font-bold text-indigo-700">{{ props.stats.completionRate }}%</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-regular fa-clock text-xs text-amber-500"></i>
                        Hours Rendered
                    </p>
                    <p class="mt-2 text-2xl font-bold text-amber-700">{{ formatHours(props.stats.hoursRendered) }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <i class="fa-solid fa-chart-column text-xs text-rose-500"></i>
                        Avg / Placement
                    </p>
                    <p class="mt-2 text-2xl font-bold text-rose-700">{{ formatHours(props.stats.averageHoursPerPlacement) }}</p>
                </div>
            </div>

            <div class="grid gap-6 xl:grid-cols-3">
                <div class="card card-body xl:col-span-2">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                <i class="fa-solid fa-chart-line text-sm text-slate-400"></i>
                                Monthly Hours Trend
                            </h3>
                            <p class="mt-1 text-xs text-slate-500">
                                Attendance hours rendered in the selected range.
                            </p>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <p v-if="peakMonth" class="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Peak: {{ peakMonth.label }} ({{ formatHours(peakMonth.hours) }})
                            </p>
                            <p
                                class="rounded-lg px-2.5 py-1 text-xs font-semibold"
                                :class="{
                                    'bg-emerald-50 text-emerald-700': trendChange.direction === 'up',
                                    'bg-rose-50 text-rose-700': trendChange.direction === 'down',
                                    'bg-slate-100 text-slate-600': trendChange.direction === 'flat',
                                }"
                            >
                                <i
                                    class="mr-1 fa-solid"
                                    :class="{
                                        'fa-arrow-trend-up': trendChange.direction === 'up',
                                        'fa-arrow-trend-down': trendChange.direction === 'down',
                                        'fa-minus': trendChange.direction === 'flat',
                                    }"
                                ></i>
                                {{ trendChange.value }}%
                            </p>
                        </div>
                    </div>

                    <div v-if="trendGraph.mapped.length > 0" class="mt-4 space-y-4">
                        <div
                            class="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                            @mouseleave="hoveredTrendKey = null"
                        >
                            <svg :viewBox="`0 0 ${trendGraph.width} ${trendGraph.height}`" class="h-[240px] w-full">
                                <g v-for="tick in trendGraph.yTicks" :key="`tick-${tick.label}`">
                                    <line
                                        :x1="trendGraph.padX"
                                        :x2="trendGraph.width - trendGraph.padX"
                                        :y1="tick.y"
                                        :y2="tick.y"
                                        stroke="#e2e8f0"
                                        stroke-dasharray="4 4"
                                    />
                                    <text
                                        x="8"
                                        :y="tick.y + 4"
                                        font-size="11"
                                        fill="#94a3b8"
                                    >{{ tick.label }}</text>
                                </g>

                                <path :d="trendAreaPath" fill="rgba(16, 185, 129, 0.16)" />
                                <path
                                    :d="trendLinePath"
                                    fill="none"
                                    stroke="#10b981"
                                    stroke-width="3"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />

                                <g
                                    v-for="point in trendGraph.mapped"
                                    :key="`point-${point.key}`"
                                    @mouseenter="hoveredTrendKey = point.key"
                                >
                                    <circle
                                        :cx="point.x"
                                        :cy="point.y"
                                        :r="activeTrendPoint?.key === point.key ? 6 : 4.5"
                                        :fill="activeTrendPoint?.key === point.key ? '#059669' : '#10b981'"
                                        class="transition-all"
                                    />
                                </g>
                            </svg>

                            <div class="mt-2 flex flex-wrap gap-1.5">
                                <button
                                    v-for="point in trendGraph.mapped"
                                    :key="`chip-${point.key}`"
                                    type="button"
                                    class="rounded-lg border px-2 py-1 text-[11px] font-semibold transition"
                                    :class="activeTrendPoint?.key === point.key
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
                                    @mouseenter="hoveredTrendKey = point.key"
                                    @focus="hoveredTrendKey = point.key"
                                >
                                    {{ point.label }}
                                </button>
                            </div>
                        </div>

                        <div class="grid gap-3 sm:grid-cols-3">
                            <div class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                                <p class="text-[11px] uppercase tracking-wide text-slate-400">Selected Month</p>
                                <p class="mt-1 text-sm font-semibold text-slate-700">{{ activeTrendPoint?.label ?? '-' }}</p>
                            </div>
                            <div class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                                <p class="text-[11px] uppercase tracking-wide text-slate-400">Hours</p>
                                <p class="mt-1 text-sm font-semibold text-emerald-700">{{ formatHours(activeTrendPoint?.hours ?? 0) }}</p>
                            </div>
                            <div class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                                <p class="text-[11px] uppercase tracking-wide text-slate-400">Attendance Logs</p>
                                <p class="mt-1 text-sm font-semibold text-slate-700">{{ activeTrendPoint?.logs ?? 0 }}</p>
                            </div>
                        </div>
                    </div>
                    <p v-else class="mt-4 text-sm text-slate-500">No monthly trend data available.</p>
                </div>

                <div class="card card-body">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-regular fa-file-lines text-sm text-slate-400"></i>
                        Report Workflow
                    </h3>
                    <p class="mt-1 text-xs text-slate-500">Daily and weekly report status distribution.</p>

                    <div v-if="reportStatus.length > 0" class="mt-4 space-y-3">
                        <div class="flex items-center gap-3 text-[11px] text-slate-500">
                            <span class="inline-flex items-center gap-1">
                                <span class="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>Daily
                            </span>
                            <span class="inline-flex items-center gap-1">
                                <span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span>Weekly
                            </span>
                        </div>
                        <div v-for="row in reportStatus" :key="`report-${row.status}`" class="space-y-1">
                            <div class="flex items-center justify-between text-xs">
                                <span class="font-semibold text-slate-700">{{ row.label }}</span>
                                <span class="text-slate-500">{{ row.count }} total • {{ row.percentage }}%</span>
                            </div>
                            <div class="space-y-1.5">
                                <div class="flex items-center gap-2">
                                    <span class="w-10 text-[11px] text-slate-400">Daily</span>
                                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                        <div class="h-2 rounded-full bg-indigo-500 transition-all" :style="{ width: workflowBarWidth(row.daily) }"></div>
                                    </div>
                                    <span class="w-8 text-right text-[11px] text-slate-500">{{ row.daily }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-10 text-[11px] text-slate-400">Weekly</span>
                                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                        <div class="h-2 rounded-full bg-rose-500 transition-all" :style="{ width: workflowBarWidth(row.weekly) }"></div>
                                    </div>
                                    <span class="w-8 text-right text-[11px] text-slate-500">{{ row.weekly }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p v-else class="mt-4 text-sm text-slate-500">No report status data available.</p>
                </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
                <div class="card card-body">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-solid fa-list-check text-sm text-slate-400"></i>
                        Placement Status
                    </h3>
                    <div v-if="placementSegments.length > 0" class="mt-4 grid gap-5 sm:grid-cols-[170px_1fr] sm:items-center">
                        <div class="mx-auto flex h-40 w-40 items-center justify-center rounded-full p-3" :style="{ background: placementDonut }">
                            <div class="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-slate-900">
                                <div class="text-center">
                                    <p class="text-[11px] uppercase tracking-wide text-slate-400">Placements</p>
                                    <p class="text-2xl font-bold text-slate-800">{{ props.stats.totalPlacements }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div v-for="row in placementSegments" :key="`placement-${row.status}`" class="space-y-1.5">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="inline-flex items-center gap-2 font-semibold text-slate-700">
                                        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: row.color }"></span>
                                        {{ row.label }}
                                    </span>
                                    <span class="text-slate-500">{{ row.count }} ({{ row.percentage }}%)</span>
                                </div>
                                <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        class="h-2 rounded-full transition-all"
                                        :style="{ width: percentWidth(row.percentage), backgroundColor: row.color }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p v-else class="mt-4 text-sm text-slate-500">No placement status data available.</p>
                </div>

                <div class="card card-body">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-regular fa-calendar-check text-sm text-slate-400"></i>
                        Attendance Status
                    </h3>
                    <div v-if="attendanceSegments.length > 0" class="mt-4 space-y-4">
                        <div class="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                            <div class="flex h-full w-full">
                                <div
                                    v-for="row in attendanceSegments"
                                    :key="`attendance-stack-${row.status}`"
                                    class="h-full"
                                    :style="{ width: percentWidth(row.percentage), backgroundColor: row.color }"
                                    :title="`${row.label}: ${row.count} logs`"
                                ></div>
                            </div>
                        </div>

                        <div class="grid gap-2 sm:grid-cols-2">
                            <div
                                v-for="row in attendanceSegments"
                                :key="`attendance-${row.status}`"
                                class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                            >
                                <div class="flex items-center justify-between text-xs">
                                    <span class="inline-flex items-center gap-2 font-semibold text-slate-700">
                                        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: row.color }"></span>
                                        {{ row.label }}
                                    </span>
                                    <span class="text-slate-500">{{ row.percentage }}%</span>
                                </div>
                                <div class="mt-1.5 text-[11px] text-slate-500">
                                    {{ row.count }} logs • {{ formatHours(row.hours) }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <p v-else class="mt-4 text-sm text-slate-500">No attendance status data available.</p>
                </div>
            </div>

            <div class="card card-body">
                <div class="mb-4 flex items-center justify-between gap-2">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-solid fa-ranking-star text-sm text-slate-400"></i>
                        Top Students by Hours
                    </h3>
                    <p class="text-xs text-slate-500">{{ props.stats.studentsTracked || 0 }} tracked students</p>
                </div>

                <div class="overflow-x-auto">
                    <table class="table-base">
                        <thead>
                            <tr class="table-head">
                                <th class="px-2 py-2">Student</th>
                                <th class="px-2 py-2">Course</th>
                                <th class="px-2 py-2">Placements</th>
                                <th class="px-2 py-2">Completed</th>
                                <th class="px-2 py-2">Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in topStudents" :key="`${row.student}-${row.course}`" class="table-row">
                                <td class="px-2 py-2 font-medium text-slate-700">{{ row.student }}</td>
                                <td class="px-2 py-2">{{ row.course }}</td>
                                <td class="px-2 py-2">{{ row.placements }}</td>
                                <td class="px-2 py-2">{{ row.completed }}</td>
                                <td class="px-2 py-2 font-semibold text-emerald-700">{{ formatHours(row.hours) }}</td>
                            </tr>
                            <tr v-if="topStudents.length === 0">
                                <td colspan="5" class="px-2 py-4 text-center text-slate-500">No student analytics available.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
                <div class="space-y-3">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-regular fa-building text-base text-slate-400"></i>
                        Per Company
                    </h3>
                    <DataTable
                        :search="companySearch"
                        search-placeholder="Search company"
                        :per-page="companyPerPage"
                        :pagination="props.perCompany"
                        @search="handleCompanySearch"
                        @per-page="handleCompanyPerPage"
                    >
                        <template #table>
                            <thead>
                                <tr class="table-head">
                                    <th class="px-2 py-2">Company</th>
                                    <th class="px-2 py-2">Placements</th>
                                    <th class="px-2 py-2">Hours</th>
                                    <th class="px-2 py-2">Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in perCompanyRows" :key="row.label" class="table-row">
                                    <td class="px-2 py-2">{{ row.label }}</td>
                                    <td class="px-2 py-2">{{ row.placements }}</td>
                                    <td class="px-2 py-2">{{ formatHours(row.hours) }}</td>
                                    <td class="px-2 py-2">{{ row.completed }}</td>
                                </tr>
                                <tr v-if="perCompanyRows.length === 0">
                                    <td colspan="4" class="px-2 py-4 text-center text-slate-500">No data available.</td>
                                </tr>
                            </tbody>
                        </template>
                    </DataTable>
                </div>

                <div class="space-y-3">
                    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <i class="fa-solid fa-graduation-cap text-base text-slate-400"></i>
                        Per Course
                    </h3>
                    <DataTable
                        :search="courseSearch"
                        search-placeholder="Search course"
                        :per-page="coursePerPage"
                        :pagination="props.perCourse"
                        @search="handleCourseSearch"
                        @per-page="handleCoursePerPage"
                    >
                        <template #table>
                            <thead>
                                <tr class="table-head">
                                    <th class="px-2 py-2">Course</th>
                                    <th class="px-2 py-2">Placements</th>
                                    <th class="px-2 py-2">Hours</th>
                                    <th class="px-2 py-2">Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in perCourseRows" :key="row.label" class="table-row">
                                    <td class="px-2 py-2">{{ row.label }}</td>
                                    <td class="px-2 py-2">{{ row.placements }}</td>
                                    <td class="px-2 py-2">{{ formatHours(row.hours) }}</td>
                                    <td class="px-2 py-2">{{ row.completed }}</td>
                                </tr>
                                <tr v-if="perCourseRows.length === 0">
                                    <td colspan="4" class="px-2 py-4 text-center text-slate-500">No data available.</td>
                                </tr>
                            </tbody>
                        </template>
                    </DataTable>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
