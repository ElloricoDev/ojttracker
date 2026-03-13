<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DataTable from '@/Components/DataTable.vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

const latestTrendPoint = computed(() => {
    const points = monthlyHours.value || [];
    return points.length > 0 ? points[points.length - 1] : null;
});

const trendChange = computed(() => {
    const points = monthlyHours.value || [];
    if (points.length < 2) {
        return { value: 0, direction: 'flat' };
    }

    const first = Number(points[0]?.hours || 0);
    const last = Number(points[points.length - 1]?.hours || 0);

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

const attendanceSegments = computed(() => {
    return attendanceStatus.value.map((row) => ({
        ...row,
        color: statusColor(row.status),
    }));
});

const trendChartRef = ref(null);
const workflowChartRef = ref(null);
const placementChartRef = ref(null);
const attendanceChartRef = ref(null);
const highchartsReady = ref(false);
const highchartsError = ref('');
let HighchartsInstance = null;
let highchartsModulesReady = false;
let themeObserver = null;

const chartInstances = {
    trend: null,
    workflow: null,
    placement: null,
    attendance: null,
};

const destroyChart = (key) => {
    if (chartInstances[key]) {
        chartInstances[key].destroy();
        chartInstances[key] = null;
    }
};

const destroyAllCharts = () => {
    destroyChart('trend');
    destroyChart('workflow');
    destroyChart('placement');
    destroyChart('attendance');
};

const initHighchartsModules = async () => {
    if (!HighchartsInstance || highchartsModulesReady) {
        return;
    }

    const accessibilityModule = await import('highcharts/modules/accessibility.js');
    const moduleFactory = accessibilityModule.default || accessibilityModule;

    if (typeof moduleFactory === 'function') {
        moduleFactory(HighchartsInstance);
    }

    highchartsModulesReady = true;
};

const getChartTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');

    return {
        textColor: isDark ? '#cbd5e1' : '#334155',
        subtleTextColor: isDark ? '#94a3b8' : '#64748b',
        gridColor: isDark ? 'rgba(148,163,184,0.22)' : 'rgba(148,163,184,0.28)',
        tooltipBg: isDark ? 'rgba(15,23,42,0.94)' : 'rgba(255,255,255,0.96)',
        tooltipBorder: isDark ? '#334155' : '#cbd5e1',
    };
};

const renderTrendChart = (Highcharts) => {
    if (!trendChartRef.value) {
        return;
    }

    if (!monthlyHours.value.length) {
        destroyChart('trend');
        return;
    }

    destroyChart('trend');
    const theme = getChartTheme();

    chartInstances.trend = Highcharts.chart(trendChartRef.value, {
        chart: {
            type: 'areaspline',
            backgroundColor: 'transparent',
            spacing: [12, 10, 12, 10],
        },
        title: { text: null },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
            categories: monthlyHours.value.map((row) => row.label),
            lineColor: theme.gridColor,
            tickColor: theme.gridColor,
            labels: {
                style: {
                    color: theme.subtleTextColor,
                    fontSize: '11px',
                },
            },
        },
        yAxis: {
            title: {
                text: 'Hours',
                style: {
                    color: theme.subtleTextColor,
                    fontSize: '11px',
                },
            },
            gridLineColor: theme.gridColor,
            labels: {
                style: {
                    color: theme.subtleTextColor,
                    fontSize: '11px',
                },
            },
        },
        tooltip: {
            useHTML: true,
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            style: {
                color: theme.textColor,
                fontSize: '12px',
            },
            formatter: function () {
                const logs = this.point.options.logs ?? 0;

                return `<strong>${this.x}</strong><br/>Hours: <strong>${formatHours(this.y || 0)}</strong><br/>Logs: <strong>${logs}</strong>`;
            },
        },
        plotOptions: {
            series: {
                animation: false,
            },
            areaspline: {
                marker: {
                    enabled: true,
                    radius: 4,
                    symbol: 'circle',
                },
                lineWidth: 3,
            },
        },
        series: [
            {
                name: 'Hours',
                color: '#10b981',
                fillColor: 'rgba(16,185,129,0.18)',
                data: monthlyHours.value.map((row) => ({
                    y: Number(row.hours || 0),
                    logs: Number(row.logs || 0),
                })),
            },
        ],
    });
};

const renderWorkflowChart = (Highcharts) => {
    if (!workflowChartRef.value) {
        return;
    }

    if (!reportStatus.value.length) {
        destroyChart('workflow');
        return;
    }

    destroyChart('workflow');
    const theme = getChartTheme();

    chartInstances.workflow = Highcharts.chart(workflowChartRef.value, {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
            spacing: [12, 10, 12, 10],
        },
        title: { text: null },
        credits: { enabled: false },
        xAxis: {
            categories: reportStatus.value.map((row) => row.label),
            lineColor: theme.gridColor,
            tickColor: theme.gridColor,
            labels: {
                style: {
                    color: theme.subtleTextColor,
                    fontSize: '11px',
                },
            },
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Reports',
                style: {
                    color: theme.subtleTextColor,
                    fontSize: '11px',
                },
            },
            gridLineColor: theme.gridColor,
            labels: {
                style: {
                    color: theme.subtleTextColor,
                    fontSize: '11px',
                },
            },
        },
        legend: {
            itemStyle: {
                color: theme.textColor,
            },
            itemHoverStyle: {
                color: theme.textColor,
            },
        },
        tooltip: {
            shared: true,
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            style: {
                color: theme.textColor,
                fontSize: '12px',
            },
        },
        plotOptions: {
            series: {
                animation: false,
                borderRadius: 4,
            },
        },
        series: [
            {
                name: 'Daily',
                color: '#6366f1',
                data: reportStatus.value.map((row) => Number(row.daily || 0)),
            },
            {
                name: 'Weekly',
                color: '#f43f5e',
                data: reportStatus.value.map((row) => Number(row.weekly || 0)),
            },
        ],
    });
};

const renderPlacementChart = (Highcharts) => {
    if (!placementChartRef.value) {
        return;
    }

    if (!placementSegments.value.length) {
        destroyChart('placement');
        return;
    }

    destroyChart('placement');
    const theme = getChartTheme();

    chartInstances.placement = Highcharts.chart(placementChartRef.value, {
        chart: {
            type: 'pie',
            backgroundColor: 'transparent',
            spacing: [12, 10, 12, 10],
        },
        title: { text: null },
        credits: { enabled: false },
        tooltip: {
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            style: {
                color: theme.textColor,
                fontSize: '12px',
            },
            pointFormat: '<strong>{point.y}</strong> placements ({point.percentage:.1f}%)',
        },
        legend: {
            enabled: true,
            itemStyle: {
                color: theme.textColor,
                fontSize: '11px',
            },
            itemHoverStyle: {
                color: theme.textColor,
            },
        },
        plotOptions: {
            series: {
                animation: false,
            },
            pie: {
                innerSize: '65%',
                showInLegend: true,
                dataLabels: {
                    enabled: false,
                },
            },
        },
        series: [
            {
                name: 'Placements',
                data: placementSegments.value.map((row) => ({
                    name: row.label,
                    y: Number(row.count || 0),
                    color: row.color,
                })),
            },
        ],
    });
};

const renderAttendanceChart = (Highcharts) => {
    if (!attendanceChartRef.value) {
        return;
    }

    if (!attendanceSegments.value.length) {
        destroyChart('attendance');
        return;
    }

    destroyChart('attendance');
    const theme = getChartTheme();

    chartInstances.attendance = Highcharts.chart(attendanceChartRef.value, {
        chart: {
            backgroundColor: 'transparent',
            spacing: [12, 10, 12, 10],
        },
        title: { text: null },
        credits: { enabled: false },
        xAxis: {
            categories: attendanceSegments.value.map((row) => row.label),
            lineColor: theme.gridColor,
            tickColor: theme.gridColor,
            labels: {
                style: {
                    color: theme.subtleTextColor,
                    fontSize: '11px',
                },
            },
        },
        yAxis: [
            {
                min: 0,
                title: {
                    text: 'Logs',
                    style: {
                        color: theme.subtleTextColor,
                        fontSize: '11px',
                    },
                },
                gridLineColor: theme.gridColor,
                labels: {
                    style: {
                        color: theme.subtleTextColor,
                        fontSize: '11px',
                    },
                },
            },
            {
                min: 0,
                opposite: true,
                title: {
                    text: 'Hours',
                    style: {
                        color: theme.subtleTextColor,
                        fontSize: '11px',
                    },
                },
                gridLineWidth: 0,
                labels: {
                    style: {
                        color: theme.subtleTextColor,
                        fontSize: '11px',
                    },
                },
            },
        ],
        legend: {
            itemStyle: {
                color: theme.textColor,
            },
            itemHoverStyle: {
                color: theme.textColor,
            },
        },
        tooltip: {
            shared: true,
            useHTML: true,
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            style: {
                color: theme.textColor,
                fontSize: '12px',
            },
            formatter: function () {
                const logsPoint = this.points?.find((point) => point.series.name === 'Logs');
                const hoursPoint = this.points?.find((point) => point.series.name === 'Hours');

                return `<strong>${this.x}</strong><br/>Logs: <strong>${logsPoint?.y ?? 0}</strong><br/>Hours: <strong>${formatHours(hoursPoint?.y ?? 0)}</strong>`;
            },
        },
        plotOptions: {
            series: {
                animation: false,
            },
            column: {
                borderRadius: 4,
            },
            spline: {
                marker: {
                    enabled: true,
                    radius: 4,
                },
            },
        },
        series: [
            {
                type: 'column',
                name: 'Logs',
                data: attendanceSegments.value.map((row) => ({
                    y: Number(row.count || 0),
                    color: row.color,
                })),
            },
            {
                type: 'spline',
                name: 'Hours',
                yAxis: 1,
                color: '#22d3ee',
                data: attendanceSegments.value.map((row) => Number(row.hours || 0)),
            },
        ],
    });
};

const renderCharts = async () => {
    if (!highchartsReady.value || !HighchartsInstance) {
        return;
    }

    await nextTick();

    const Highcharts = HighchartsInstance;
    renderTrendChart(Highcharts);
    renderWorkflowChart(Highcharts);
    renderPlacementChart(Highcharts);
    renderAttendanceChart(Highcharts);
};

onMounted(async () => {
    try {
        const highchartsModule = await import('highcharts');
        HighchartsInstance = highchartsModule.default || highchartsModule;
        await initHighchartsModules();
        highchartsReady.value = true;
        highchartsError.value = '';
        await renderCharts();
    } catch (error) {
        highchartsReady.value = false;
        highchartsError.value = error?.message || 'Unable to initialize Highcharts. Run npm install and restart Vite.';
        destroyAllCharts();
    }

    themeObserver = new MutationObserver(() => {
        renderCharts();
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });
});

watch(
    [monthlyHours, reportStatus, placementSegments, attendanceSegments],
    () => {
        renderCharts();
    },
    { deep: true },
);

onBeforeUnmount(() => {
    themeObserver?.disconnect();
    themeObserver = null;
    destroyAllCharts();
});
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

                    <div v-if="monthlyHours.length > 0" class="mt-4 space-y-4">
                        <div
                            v-if="highchartsError"
                            class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                        >
                            {{ highchartsError }}
                        </div>
                        <div
                            v-else-if="!highchartsReady"
                            class="rounded-xl border border-slate-200 bg-white/80 px-3 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400"
                        >
                            Loading chart...
                        </div>
                        <div
                            v-else
                            ref="trendChartRef"
                            class="h-[300px] w-full rounded-2xl border border-slate-200 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/50"
                        ></div>

                        <div class="grid gap-3 sm:grid-cols-3">
                            <div class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                                <p class="text-[11px] uppercase tracking-wide text-slate-400">Latest Month</p>
                                <p class="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ latestTrendPoint?.label ?? '-' }}</p>
                            </div>
                            <div class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                                <p class="text-[11px] uppercase tracking-wide text-slate-400">Hours</p>
                                <p class="mt-1 text-sm font-semibold text-emerald-700">{{ formatHours(latestTrendPoint?.hours ?? 0) }}</p>
                            </div>
                            <div class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                                <p class="text-[11px] uppercase tracking-wide text-slate-400">Attendance Logs</p>
                                <p class="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ latestTrendPoint?.logs ?? 0 }}</p>
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

                    <div v-if="reportStatus.length > 0" class="mt-4 space-y-4">
                        <div
                            v-if="highchartsError"
                            class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                        >
                            {{ highchartsError }}
                        </div>
                        <div
                            v-else-if="!highchartsReady"
                            class="rounded-xl border border-slate-200 bg-white/80 px-3 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400"
                        >
                            Loading chart...
                        </div>
                        <div
                            v-else
                            ref="workflowChartRef"
                            class="h-[300px] w-full rounded-2xl border border-slate-200 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/50"
                        ></div>

                        <div class="grid gap-2 sm:grid-cols-2">
                            <div
                                v-for="row in reportStatus"
                                :key="`report-${row.status}`"
                                class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                            >
                                <div class="flex items-center justify-between text-xs">
                                    <span class="font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                                    <span class="text-slate-500">{{ row.count }} total • {{ row.percentage }}%</span>
                                </div>
                                <div class="mt-1.5 text-[11px] text-slate-500">
                                    {{ row.daily }} daily • {{ row.weekly }} weekly
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
                    <div v-if="placementSegments.length > 0" class="mt-4 space-y-4">
                        <div
                            v-if="highchartsError"
                            class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                        >
                            {{ highchartsError }}
                        </div>
                        <div
                            v-else-if="!highchartsReady"
                            class="rounded-xl border border-slate-200 bg-white/80 px-3 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400"
                        >
                            Loading chart...
                        </div>
                        <div
                            v-else
                            ref="placementChartRef"
                            class="h-[300px] w-full rounded-2xl border border-slate-200 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/50"
                        ></div>

                        <div class="grid gap-2 sm:grid-cols-2">
                            <div
                                v-for="row in placementSegments"
                                :key="`placement-${row.status}`"
                                class="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                            >
                                <div class="flex items-center justify-between text-xs">
                                    <span class="inline-flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                                        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: row.color }"></span>
                                        {{ row.label }}
                                    </span>
                                    <span class="text-slate-500">{{ row.count }} ({{ row.percentage }}%)</span>
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
                        <div
                            v-if="highchartsError"
                            class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                        >
                            {{ highchartsError }}
                        </div>
                        <div
                            v-else-if="!highchartsReady"
                            class="rounded-xl border border-slate-200 bg-white/80 px-3 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400"
                        >
                            Loading chart...
                        </div>
                        <div
                            v-else
                            ref="attendanceChartRef"
                            class="h-[300px] w-full rounded-2xl border border-slate-200 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/50"
                        ></div>

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
