<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';

const props = defineProps({
    supervisors: Object,
    filters: Object,
});

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'created_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('supervisors.index'), {
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

    router.delete(route('supervisors.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};
</script>

<template>
    <Head title="Supervisors" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-id-badge text-base text-slate-400"></i>
                    Supervisors
                </h2>
                <Link :href="route('supervisors.create')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-plus text-xs"></i>
                    New Supervisor
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search name, email, company"
                :per-page="perPage"
                :pagination="supervisors"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <th class="px-2 py-2">Name</th>
                            <th class="px-2 py-2">Email</th>
                            <th class="px-2 py-2">Company</th>
                            <SortableTh label="Position" sort-key="position" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Contact" sort-key="contact_no" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="supervisor in supervisors.data" :key="supervisor.id" class="table-row">
                            <td class="px-2 py-2">{{ supervisor.name }}</td>
                            <td class="px-2 py-2">{{ supervisor.email }}</td>
                            <td class="px-2 py-2">{{ supervisor.company }}</td>
                            <td class="px-2 py-2">{{ supervisor.position || '-' }}</td>
                            <td class="px-2 py-2">{{ supervisor.contact_no || '-' }}</td>
                            <td class="px-2 py-2">
                                <div class="flex flex-wrap gap-2">
                                    <Link :href="route('supervisors.edit', supervisor.id)" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                        <i class="fa-regular fa-pen-to-square text-xs"></i>
                                        Edit
                                    </Link>
                                    <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100" @click="requestDelete(supervisor.id)">
                                        <i class="fa-regular fa-trash-can text-xs"></i>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="supervisors.data.length === 0">
                            <td colspan="6" class="px-2 py-4 text-center text-slate-500">No supervisors found.</td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete supervisor"
        message="This will permanently remove the supervisor account."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
</template>
