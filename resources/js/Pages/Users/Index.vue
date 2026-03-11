<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';

const props = defineProps({
    users: Object,
    filters: Object,
});

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'created_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('users.index'), {
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

    router.delete(route('users.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};
</script>

<template>
    <Head title="Users" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                        <i class="fa-regular fa-user text-base text-slate-400"></i>
                        Users
                    </h2>
                    <p class="mt-1 text-sm text-slate-500">Manage admin, coordinator, and adviser accounts. Student and supervisor accounts are managed in their own modules.</p>
                </div>
                <Link :href="route('users.create')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-user-plus text-xs"></i>
                    New User
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search name, email, or role"
                :per-page="perPage"
                :pagination="props.users"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <SortableTh label="Name" sort-key="name" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Email" sort-key="email" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Role" sort-key="role" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Status" sort-key="status" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Department</th>
                            <th class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in props.users.data" :key="user.id" class="table-row">
                            <td class="px-2 py-2">{{ user.name }}</td>
                            <td class="px-2 py-2">{{ user.email }}</td>
                            <td class="px-2 py-2 capitalize">{{ user.role }}</td>
                            <td class="px-2 py-2">
                                <span class="badge" :class="user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                                    {{ user.status }}
                                </span>
                            </td>
                            <td class="px-2 py-2 text-sm text-slate-600">
                                <div v-if="user.profile.department">{{ user.profile.department }}</div>
                                <div v-else class="text-slate-400">—</div>
                            </td>
                            <td class="px-2 py-2">
                                <div class="flex flex-wrap gap-2">
                                    <Link :href="route('users.edit', user.id)" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                        <i class="fa-regular fa-pen-to-square text-xs"></i>
                                        Edit
                                    </Link>
                                    <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100" @click="requestDelete(user.id)">
                                        <i class="fa-regular fa-trash-can text-xs"></i>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="props.users.data.length === 0">
                            <td colspan="6" class="px-2 py-4 text-center text-slate-500">No users found.</td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete user"
        message="This will permanently remove the user account and its profile."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
</template>

