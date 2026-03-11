<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ref } from 'vue';

const props = defineProps({
    companies: Object,
    filters: Object,
});

const page = usePage();
const canManage = ['admin', 'coordinator'].includes(page.props.auth?.user?.role);

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'created_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('companies.index'), {
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

    router.delete(route('companies.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};
</script>

<template>
    <Head title="Companies" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-building text-base text-slate-400"></i>
                    Companies
                </h2>
                <Link v-if="canManage" :href="route('companies.create')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-plus text-xs"></i>
                    New Company
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search name, contact, email"
                :per-page="perPage"
                :pagination="companies"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <SortableTh label="Name" sort-key="name" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Contact Person</th>
                            <th class="px-2 py-2">Email</th>
                            <th class="px-2 py-2">Phone</th>
                            <SortableTh label="Status" sort-key="is_active" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th v-if="canManage" class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="company in companies.data" :key="company.id" class="table-row">
                            <td class="px-2 py-2">{{ company.name }}</td>
                            <td class="px-2 py-2">{{ company.contact_person || '-' }}</td>
                            <td class="px-2 py-2">{{ company.email || '-' }}</td>
                            <td class="px-2 py-2">{{ company.phone || '-' }}</td>
                            <td class="px-2 py-2">
                                <span class="badge" :class="company.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                                    {{ company.is_active ? 'Active' : 'Inactive' }}
                                </span>
                            </td>
                            <td v-if="canManage" class="px-2 py-2">
                                <div class="flex flex-wrap gap-2">
                                    <Link :href="route('companies.edit', company.id)" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                        <i class="fa-regular fa-pen-to-square text-xs"></i>
                                        Edit
                                    </Link>
                                    <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100" @click="requestDelete(company.id)">
                                        <i class="fa-regular fa-trash-can text-xs"></i>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="companies.data.length === 0">
                            <td :colspan="canManage ? 6 : 5" class="px-2 py-4 text-center text-slate-500">No companies found.</td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete company"
        message="This will permanently remove the company record."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
</template>
