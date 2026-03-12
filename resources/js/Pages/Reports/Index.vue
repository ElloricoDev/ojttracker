<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DataTable from '@/Components/DataTable.vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatHours } from '@/utils/formatters';

const props = defineProps({
    stats: Object,
    perCompany: Object,
    perCourse: Object,
    filters: Object,
});

const companySearch = ref(props.filters?.company_search || '');
const courseSearch = ref(props.filters?.course_search || '');
const companyPerPage = ref(props.filters?.company_per_page || 10);
const coursePerPage = ref(props.filters?.course_per_page || 10);

const refresh = (options = {}) => {
    router.get(route('reports.index'), {
        company_search: companySearch.value || undefined,
        course_search: courseSearch.value || undefined,
        company_per_page: companyPerPage.value || undefined,
        course_per_page: coursePerPage.value || undefined,
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
</script>

<template>
    <Head title="📊 Reports" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                <i class="fa-regular fa-chart-bar text-base text-slate-400"></i>
                Reports
            </h2>
        </template>

        <div class="space-y-6">
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
            <div class="grid gap-4 md:grid-cols-4">
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="fa-solid fa-briefcase text-xs text-slate-400"></i>
                        Total Placements
                    </p>
                    <p class="text-2xl font-bold text-slate-900">{{ props.stats.totalPlacements }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="fa-solid fa-circle-check text-xs text-emerald-500"></i>
                        Completed
                    </p>
                    <p class="text-2xl font-bold text-emerald-700">{{ props.stats.completedPlacements }}</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="fa-solid fa-percent text-xs text-sky-500"></i>
                        Completion Rate
                    </p>
                    <p class="text-2xl font-bold text-sky-700">{{ props.stats.completionRate }}%</p>
                </div>
                <div class="card-sm card-sm-body">
                    <p class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="fa-regular fa-clock text-xs text-indigo-500"></i>
                        Hours Rendered
                    </p>
                    <p class="text-2xl font-bold text-indigo-700">{{ formatHours(props.stats.hoursRendered) }}</p>
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
                                <tr v-for="row in props.perCompany.data" :key="row.label" class="table-row">
                                    <td class="px-2 py-2">{{ row.label }}</td>
                                    <td class="px-2 py-2">{{ row.placements }}</td>
                                    <td class="px-2 py-2">{{ formatHours(row.hours) }}</td>
                                    <td class="px-2 py-2">{{ row.completed }}</td>
                                </tr>
                                <tr v-if="!props.perCompany.data || props.perCompany.data.length === 0">
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
                                <tr v-for="row in props.perCourse.data" :key="row.label" class="table-row">
                                    <td class="px-2 py-2">{{ row.label }}</td>
                                    <td class="px-2 py-2">{{ row.placements }}</td>
                                    <td class="px-2 py-2">{{ formatHours(row.hours) }}</td>
                                    <td class="px-2 py-2">{{ row.completed }}</td>
                                </tr>
                                <tr v-if="!props.perCourse.data || props.perCourse.data.length === 0">
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
