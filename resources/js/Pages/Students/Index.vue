<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatHours } from '@/utils/formatters';

const props = defineProps({
    students: Object,
    filters: Object,
});

const page = usePage();
const canManage = ['admin', 'coordinator'].includes(page.props.auth?.user?.role);

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'created_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('students.index'), {
        search: search.value || undefined,
        per_page: perPage.value || undefined,
        sort: sortKey.value || undefined,
        direction: direction.value || undefined,
        ...options,
    }, {
        preserveState: true,
        replace: true,
    });
};

const handleSearch = (value) => {
    search.value = value;
    refresh({ page: 1 });
};

const handlePerPage = (value) => {
    perPage.value = Number(value);
    refresh({ page: 1 });
};

const handleSort = ({ key, direction: nextDirection }) => {
    sortKey.value = key;
    direction.value = nextDirection;
    refresh({ page: 1 });
};

const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);

const requestDelete = (id) => {
    deleteTargetId.value = id;
    showDeleteConfirm.value = true;
};

const confirmDelete = () => {
    if (!deleteTargetId.value) {
        return;
    }

    router.delete(route('students.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};
</script>

<template>
    <Head title="Students" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-solid fa-graduation-cap text-base text-slate-400"></i>
                    Students
                </h2>
                <Link v-if="canManage" :href="route('students.create')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-user-plus text-xs"></i>
                    New Student
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search name, email, course, batch"
                :per-page="perPage"
                :pagination="students"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <SortableTh label="Student No" sort-key="student_no" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Name</th>
                            <th class="px-2 py-2">Email</th>
                            <SortableTh label="Course" sort-key="course" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Year" sort-key="year_level" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Required Hours" sort-key="required_hours" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Batch</th>
                            <th v-if="canManage" class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="student in students.data" :key="student.id" class="table-row">
                            <td class="px-2 py-2">{{ student.student_no }}</td>
                            <td class="px-2 py-2">{{ student.name }}</td>
                            <td class="px-2 py-2">{{ student.email }}</td>
                            <td class="px-2 py-2">{{ student.course }}</td>
                            <td class="px-2 py-2">{{ student.year_level }}</td>
                            <td class="px-2 py-2">{{ formatHours(student.required_hours) }}</td>
                            <td class="px-2 py-2">{{ student.batch || '-' }}</td>
                            <td v-if="canManage" class="px-2 py-2">
                                <div class="flex flex-wrap gap-2">
                                    <Link :href="route('students.edit', student.id)" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                        <i class="fa-regular fa-pen-to-square text-xs"></i>
                                        Edit
                                    </Link>
                                    <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100" @click="requestDelete(student.id)">
                                        <i class="fa-regular fa-trash-can text-xs"></i>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="students.data.length === 0">
                            <td :colspan="canManage ? 8 : 7" class="px-2 py-4 text-center text-slate-500">No students found.</td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete student"
        message="This will permanently remove the student account."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
</template>
