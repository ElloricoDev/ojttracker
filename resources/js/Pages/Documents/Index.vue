<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatDateTime } from '@/utils/formatters';

const props = defineProps({
    placements: Array,
    selectedPlacementId: Number,
    documents: Object,
    filters: Object,
});

const page = usePage();
const canVerify = ['admin', 'coordinator', 'adviser', 'supervisor'].includes(page.props.auth?.user?.role);

const placementId = ref(props.selectedPlacementId || '');
const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'submitted_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('documents.index'), {
        placement_id: placementId.value || undefined,
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

const changePlacement = () => {
    refresh({ page: 1 });
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

const updateStatus = (document, status) => {
    if (!canVerify) {
        return;
    }

    router.patch(route('documents.update', document.id), { status });
};

const showStatusConfirm = ref(false);
const statusTarget = ref(null);
const statusConfirmTitle = ref('Confirm action');
const statusConfirmMessage = ref('Are you sure you want to continue?');
const statusConfirmLabel = ref('Continue');

const requestStatusChange = (document, status) => {
    statusTarget.value = { document, status };

    if (status === 'verified') {
        statusConfirmTitle.value = 'Verify document';
        statusConfirmMessage.value = 'Mark this document as verified?';
        statusConfirmLabel.value = 'Verify';
    } else if (status === 'pending') {
        statusConfirmTitle.value = 'Reset document';
        statusConfirmMessage.value = 'Reset this document back to pending?';
        statusConfirmLabel.value = 'Reset';
    } else if (status === 'rejected') {
        statusConfirmTitle.value = 'Reject document';
        statusConfirmMessage.value = 'Reject this document and mark it as rejected?';
        statusConfirmLabel.value = 'Reject';
    } else {
        statusConfirmTitle.value = 'Confirm action';
        statusConfirmMessage.value = 'Are you sure you want to continue?';
        statusConfirmLabel.value = 'Continue';
    }

    showStatusConfirm.value = true;
};

const confirmStatusChange = () => {
    if (!statusTarget.value) {
        return;
    }

    updateStatus(statusTarget.value.document, statusTarget.value.status);
    showStatusConfirm.value = false;
    statusTarget.value = null;
};

const closeStatusConfirm = () => {
    showStatusConfirm.value = false;
    statusTarget.value = null;
};

const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);

const requestDelete = (document) => {
    deleteTargetId.value = document?.id ?? null;
    showDeleteConfirm.value = true;
};

const confirmDelete = () => {
    if (!deleteTargetId.value) {
        return;
    }

    router.delete(route('documents.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};
</script>

<template>
    <Head title="Documents" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-file-lines text-base text-slate-400"></i>
                    Documents
                </h2>
                <Link :href="route('documents.create', { placement_id: placementId || undefined })" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-plus text-xs"></i>
                    Upload Document
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search type or status"
                :per-page="perPage"
                :pagination="props.documents"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #filters>
                    <div class="relative w-full max-w-[240px]">
                        <i class="fa-solid fa-briefcase pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                        <select v-model="placementId" class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" @change="changePlacement">
                            <option value="">Select placement</option>
                            <option v-for="placement in props.placements" :key="placement.id" :value="placement.id">
                                {{ placement.student?.user?.name }} - {{ placement.company?.name }}
                            </option>
                        </select>
                    </div>
                </template>
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <SortableTh label="Type" sort-key="document_type" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Status" sort-key="status" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Submitted" sort-key="submitted_at" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">File</th>
                            <th class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="document in props.documents.data" :key="document.id" class="table-row">
                            <td class="px-2 py-2">{{ document.document_type }}</td>
                            <td class="px-2 py-2"><StatusBadge :status="document.status" /></td>
                            <td class="px-2 py-2">{{ formatDateTime(document.submitted_at) }}</td>
                            <td class="px-2 py-2">
                                <a v-if="document.download_url" :href="document.download_url" class="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-600">
                                    <i class="fa-regular fa-eye text-xs"></i>
                                    Download
                                </a>
                                <span v-else class="text-slate-500">N/A</span>
                            </td>
                            <td class="px-2 py-2">
                                <div class="flex flex-wrap gap-1.5">
                                    <button type="button" class="btn-action-emerald disabled:opacity-50" :disabled="!canVerify" @click="requestStatusChange(document, 'verified')">
                                        <i class="fa-solid fa-circle-check text-xs"></i>
                                        Verify
                                    </button>
                                    <button type="button" class="btn-action-amber disabled:opacity-50" :disabled="!canVerify" @click="requestStatusChange(document, 'pending')">
                                        <i class="fa-solid fa-rotate text-xs"></i>
                                        Reset
                                    </button>
                                    <button type="button" class="btn-action-rose disabled:opacity-50" :disabled="!canVerify" @click="requestStatusChange(document, 'rejected')">
                                        <i class="fa-solid fa-ban text-xs"></i>
                                        Reject
                                    </button>
                                    <button type="button" class="btn-action-rose disabled:opacity-50" :disabled="!canVerify" @click="requestDelete(document)">
                                        <i class="fa-regular fa-trash-can text-xs"></i>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!props.documents.data || props.documents.data.length === 0">
                            <td colspan="5" class="py-12 text-center">
                                <div class="empty-state">
                                    <div class="empty-state-icon">
                                        <i class="fa-regular fa-file-lines text-xl"></i>
                                    </div>
                                    <p class="text-sm font-medium text-slate-500">No documents found</p>
                                    <p class="text-xs text-slate-400">Upload your first document to get started</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete document"
        message="This will permanently remove the document and its file."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
    <ConfirmDialog
        :show="showStatusConfirm"
        :title="statusConfirmTitle"
        :message="statusConfirmMessage"
        :confirm-label="statusConfirmLabel"
        @confirm="confirmStatusChange"
        @close="closeStatusConfirm"
    />
</template>
