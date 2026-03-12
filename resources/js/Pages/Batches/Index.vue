<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatDate } from '@/utils/formatters';

const props = defineProps({
    batches: Object,
    filters: Object,
});

const page = usePage();
const canManage = ['admin', 'coordinator'].includes(page.props.auth?.user?.role);

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'start_date');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('batches.index'), {
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

    router.delete(route('batches.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};
</script>

<template>
    <Head title="🗂️ OJT Batches" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-calendar text-base text-slate-400"></i>
                    OJT Batches
                </h2>
                <Link v-if="canManage" :href="route('batches.create')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-plus text-xs"></i>
                    New Batch
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search name, school year, semester"
                :per-page="perPage"
                :pagination="batches"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <SortableTh label="Name" sort-key="name" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="School Year" sort-key="school_year" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Semester" sort-key="semester" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Start Date" sort-key="start_date" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="End Date" sort-key="end_date" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th v-if="canManage" class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="batch in batches.data" :key="batch.id" class="table-row">
                            <td class="px-2 py-2">{{ batch.name }}</td>
                            <td class="px-2 py-2">{{ batch.school_year }}</td>
                            <td class="px-2 py-2">{{ batch.semester }}</td>
                            <td class="px-2 py-2">{{ formatDate(batch.start_date) }}</td>
                            <td class="px-2 py-2">{{ formatDate(batch.end_date) }}</td>
                            <td v-if="canManage" class="px-2 py-2">
                                <div class="flex flex-wrap gap-2">
                                    <Link :href="route('batches.edit', batch.id)" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                        <i class="fa-regular fa-pen-to-square text-xs"></i>
                                        Edit
                                    </Link>
                                    <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100" @click="requestDelete(batch.id)">
                                        <i class="fa-regular fa-trash-can text-xs"></i>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="batches.data.length === 0">
                            <td :colspan="canManage ? 6 : 5" class="px-2 py-4 text-center text-slate-500">No batches found.</td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete batch"
        message="This will permanently remove the batch record."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
</template>
