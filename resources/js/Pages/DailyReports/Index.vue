<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DataTable from '@/Components/DataTable.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import Modal from '@/Components/Modal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import SortableTh from '@/Components/SortableTh.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatDate, formatHours } from '@/utils/formatters';

const props = defineProps({
    placements: Array,
    selectedPlacementId: Number,
    dailyReports: Object,
    filters: Object,
    canViewAll: Boolean,
});

const page = usePage();
const canReview = ['admin', 'coordinator', 'adviser', 'supervisor'].includes(page.props.auth?.user?.role);

const placementId = ref(
    props.selectedPlacementId !== null && props.selectedPlacementId !== undefined
        ? String(props.selectedPlacementId)
        : (props.canViewAll ? '0' : '')
);

const changePlacement = () => {
    router.get(route('daily-reports.index'), {
        placement_id: placementId.value !== '' ? placementId.value : undefined,
        search: search.value || undefined,
        per_page: perPage.value || undefined,
        sort: sortKey.value || undefined,
        direction: direction.value || undefined,
        page: 1,
    }, { preserveState: true, replace: true });
};

const approveReport = (report) => {
    if (!canReview) {
        return;
    }

    router.patch(route('daily-reports.update', report.id), {
        status: 'reviewed',
        reviewer_comment: report.reviewer_comment || '',
    }, { preserveScroll: true });
};

const showApproveConfirm = ref(false);
const approveTarget = ref(null);

const requestApprove = (report) => {
    if (!canReview) {
        return;
    }
    approveTarget.value = report;
    showApproveConfirm.value = true;
};

const confirmApprove = () => {
    if (!approveTarget.value) {
        return;
    }
    approveReport(approveTarget.value);
    showApproveConfirm.value = false;
    approveTarget.value = null;
};

const closeApprove = () => {
    showApproveConfirm.value = false;
    approveTarget.value = null;
};

const showRejectModal = ref(false);
const rejectTarget = ref(null);
const rejectComment = ref('');

const rejectReport = (report) => {
    if (!canReview) {
        return;
    }

    rejectTarget.value = report;
    rejectComment.value = report?.reviewer_comment || '';
    showRejectModal.value = true;
};

const confirmReject = () => {
    if (!rejectTarget.value) {
        return;
    }

    router.patch(route('daily-reports.update', rejectTarget.value.id), {
        status: 'rejected',
        reviewer_comment: rejectComment.value || '',
    }, { preserveScroll: true });

    showRejectModal.value = false;
    rejectTarget.value = null;
    rejectComment.value = '';
};

const closeReject = () => {
    showRejectModal.value = false;
    rejectTarget.value = null;
    rejectComment.value = '';
};

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'work_date');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('daily-reports.index'), {
        placement_id: placementId.value !== '' ? placementId.value : undefined,
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
</script>

<template>
    <Head title="📝 Daily Reports" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-clipboard text-base text-slate-400"></i>
                    Daily Reports
                </h2>
                <Link :href="route('daily-reports.create', { placement_id: placementId && placementId !== '0' ? placementId : undefined })" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-plus text-xs"></i>
                    New Report
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search date or accomplishments"
                :per-page="perPage"
                :pagination="props.dailyReports"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #filters>
                    <div class="relative w-full max-w-[240px]">
                        <i class="fa-solid fa-briefcase pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                        <select v-model="placementId" class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" @change="changePlacement">
                            <option v-if="props.canViewAll" value="0">All placements</option>
                            <option v-else value="">Select placement</option>
                            <option v-for="placement in props.placements" :key="placement.id" :value="placement.id">
                                {{ placement.student?.user?.name }} - {{ placement.company?.name }}
                            </option>
                        </select>
                    </div>
                </template>
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <SortableTh label="Work Date" sort-key="work_date" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Hours" sort-key="hours_rendered" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Status" sort-key="status" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Accomplishments</th>
                            <th class="px-2 py-2">Reviewer</th>
                            <th class="px-2 py-2">Comment</th>
                            <th v-if="canReview" class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="report in props.dailyReports.data" :key="report.id" class="table-row">
                            <td class="px-2 py-2">{{ formatDate(report.work_date) }}</td>
                            <td class="px-2 py-2">{{ formatHours(report.hours_rendered) }}</td>
                            <td class="px-2 py-2"><StatusBadge :status="report.status" /></td>
                            <td class="px-2 py-2">{{ report.accomplishments }}</td>
                            <td class="px-2 py-2">{{ report.reviewer?.name || '-' }}</td>
                            <td class="px-2 py-2">{{ report.reviewer_comment || '-' }}</td>
                            <td v-if="canReview" class="px-2 py-2">
                                <div class="flex flex-wrap gap-1.5">
                                    <button type="button" class="btn-action-emerald disabled:opacity-50" :disabled="report.status === 'reviewed'" @click="requestApprove(report)">
                                        <i class="fa-solid fa-circle-check text-xs"></i>
                                        Approve
                                    </button>
                                    <button type="button" class="btn-action-rose disabled:opacity-50" :disabled="report.status === 'rejected'" @click="rejectReport(report)">
                                        <i class="fa-solid fa-ban text-xs"></i>
                                        Reject
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!props.dailyReports.data || props.dailyReports.data.length === 0">
                            <td :colspan="canReview ? 7 : 6" class="py-12 text-center">
                                <div class="empty-state">
                                    <div class="empty-state-icon">
                                        <i class="fa-regular fa-clipboard text-xl"></i>
                                    </div>
                                    <p class="text-sm font-medium text-slate-500">No daily reports found</p>
                                    <p class="text-xs text-slate-400">Select a placement or start submitting reports</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>

    <Modal :show="showRejectModal" @close="closeReject">
        <div class="p-6">
            <h2 class="text-lg font-medium text-slate-900">Reject daily report</h2>
            <p class="mt-2 text-sm text-slate-600">Add an optional comment for the trainee.</p>
            <textarea v-model="rejectComment" class="mt-4 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-rose-400 focus:ring-rose-400" rows="4" />
            <div class="mt-6 flex justify-end gap-3">
                <SecondaryButton @click="closeReject">Cancel</SecondaryButton>
                <PrimaryButton @click="confirmReject">Reject Report</PrimaryButton>
            </div>
        </div>
    </Modal>

    <ConfirmDialog
        :show="showApproveConfirm"
        title="Approve daily report"
        message="This will mark the report as reviewed and notify the trainee. Continue?"
        confirm-label="Approve"
        cancel-label="Cancel"
        tone="success"
        @confirm="confirmApprove"
        @close="closeApprove"
    />
</template>
