<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatHours } from '@/utils/formatters';

const props = defineProps({
    placements: {
        type: Object,
        required: true,
    },
    filters: {
        type: Object,
        required: true,
    },
});

const page = usePage();
const role = page.props.auth?.user?.role;
const canManage = ['admin', 'coordinator'].includes(role);
const canRequest = role === 'student';

const search = ref(props.filters.search || '');
const status = ref(props.filters.status || '');
const perPage = ref(props.filters.per_page || 10);
const sortKey = ref(props.filters.sort || 'created_at');
const direction = ref(props.filters.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('placements.index'), {
        search: search.value || undefined,
        status: status.value || undefined,
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

const handleStatusChange = (event) => {
    status.value = event.target.value;
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

const changeStatus = (placement, action) => {
    router.patch(route(`placements.${action}`, placement.id));
};

const canApprove = (status) => status === 'pending';
const canActivate = (status) => status === 'approved';
const canComplete = (status) => status === 'active';
const canCancel = (status) => ['pending', 'approved', 'active'].includes(status);

const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);
const showStatusConfirm = ref(false);
const statusTarget = ref(null);
const statusConfirmTitle = ref('Confirm action');
const statusConfirmMessage = ref('Are you sure you want to continue?');
const statusConfirmLabel = ref('Continue');

const requestDelete = (id) => {
    deleteTargetId.value = id;
    showDeleteConfirm.value = true;
};

const requestStatusChange = (placement, action) => {
    statusTarget.value = { placement, action };

    if (action === 'approve') {
        statusConfirmTitle.value = 'Approve placement';
        statusConfirmMessage.value = 'Approve this placement and move it forward for activation?';
        statusConfirmLabel.value = 'Approve';
    } else if (action === 'complete') {
        statusConfirmTitle.value = 'Complete placement';
        statusConfirmMessage.value = 'Mark this placement as completed?';
        statusConfirmLabel.value = 'Mark complete';
    } else if (action === 'cancel') {
        statusConfirmTitle.value = 'Cancel placement';
        statusConfirmMessage.value = 'Canceling will stop this placement from progressing. Continue?';
        statusConfirmLabel.value = 'Cancel placement';
    } else {
        statusConfirmTitle.value = 'Confirm action';
        statusConfirmMessage.value = 'Are you sure you want to continue?';
        statusConfirmLabel.value = 'Continue';
    }

    showStatusConfirm.value = true;
};

const confirmDelete = () => {
    if (!deleteTargetId.value) {
        return;
    }

    router.delete(route('placements.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const confirmStatusChange = () => {
    if (!statusTarget.value) {
        return;
    }

    changeStatus(statusTarget.value.placement, statusTarget.value.action);
    showStatusConfirm.value = false;
    statusTarget.value = null;
};

const closeStatusConfirm = () => {
    showStatusConfirm.value = false;
    statusTarget.value = null;
};
</script>

<template>
    <Head title="Placements" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-solid fa-briefcase text-base text-slate-400"></i>
                    Placements
                </h2>
                <div class="flex items-center gap-2">
                    <Link v-if="canRequest" :href="route('placements.request')" class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                        <i class="fa-solid fa-paper-plane text-xs"></i>
                        Request Placement
                    </Link>
                    <Link v-if="canManage" :href="route('placements.create')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                        <i class="fa-solid fa-plus text-xs"></i>
                        New Placement
                    </Link>
                </div>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search student/company"
                :per-page="perPage"
                :pagination="placements"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #filters>
                    <div class="relative w-full max-w-[220px]">
                        <i class="fa-solid fa-layer-group pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                        <select class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" :value="status" @change="handleStatusChange">
                            <option value="">All status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </template>
                <template #table>
                    <thead>
                        <tr class="table-head">
                                <th class="px-2 py-2">Student</th>
                                <th class="px-2 py-2">Company</th>
                                <th class="px-2 py-2">Batch</th>
                                <SortableTh label="Status" sort-key="status" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                                <SortableTh label="Hours" sort-key="required_hours" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                                <th v-if="canManage" class="px-2 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="placement in placements.data" :key="placement.id" class="table-row">
                                <td class="px-2 py-2">{{ placement.student?.user?.name }}</td>
                                <td class="px-2 py-2">{{ placement.company?.name }}</td>
                                <td class="px-2 py-2">{{ placement.batch?.name }}</td>
                                <td class="px-2 py-2 capitalize">{{ placement.status }}</td>
                                <td class="px-2 py-2">{{ formatHours(placement.required_hours) }}</td>
                                <td v-if="canManage" class="px-2 py-2">
                                    <div class="flex flex-wrap gap-2">
                                        <Link :href="route('placements.edit', placement.id)" class="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                                            <i class="fa-regular fa-pen-to-square text-xs"></i>
                                            Edit
                                        </Link>
                                        <button v-if="canApprove(placement.status)" type="button" class="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100" @click="requestStatusChange(placement, 'approve')">
                                            <i class="fa-solid fa-circle-check text-xs"></i>
                                            Approve
                                        </button>
                                        <button v-if="canActivate(placement.status)" type="button" class="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100" @click="changeStatus(placement, 'activate')">
                                            <i class="fa-solid fa-play text-xs"></i>
                                            Activate
                                        </button>
                                        <button v-if="canComplete(placement.status)" type="button" class="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100" @click="requestStatusChange(placement, 'complete')">
                                            <i class="fa-solid fa-flag-checkered text-xs"></i>
                                            Complete
                                        </button>
                                        <button v-if="canCancel(placement.status)" type="button" class="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100" @click="requestStatusChange(placement, 'cancel')">
                                            <i class="fa-solid fa-ban text-xs"></i>
                                            Cancel
                                        </button>
                                        <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100" @click="requestDelete(placement.id)">
                                            <i class="fa-regular fa-trash-can text-xs"></i>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="placements.data.length === 0">
                                <td :colspan="canManage ? 6 : 5" class="px-2 py-4 text-center text-slate-500">No placements found.</td>
                            </tr>
                        </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete placement"
        message="This will permanently remove the placement record."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
    <ConfirmDialog
        :show="showStatusConfirm"
        :title="statusConfirmTitle"
        :message="statusConfirmMessage"
        :confirm-label="statusConfirmLabel"
        cancel-label="Back"
        tone="warning"
        @confirm="confirmStatusChange"
        @close="closeStatusConfirm"
    />
</template>
