<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatDate } from '@/utils/formatters';

const props = defineProps({
    placements: Array,
    selectedPlacementId: Number,
    evaluations: Object,
    filters: Object,
});

const page = usePage();
const role = page.props.auth?.user?.role;
const canEdit = ['admin', 'coordinator', 'adviser', 'supervisor'].includes(role);

const placementId = ref(props.selectedPlacementId || '');
const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'evaluated_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('evaluations.index'), {
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

const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);

const requestDelete = (evaluation) => {
    deleteTargetId.value = evaluation?.id ?? null;
    showDeleteConfirm.value = true;
};

const confirmDelete = () => {
    if (!deleteTargetId.value) {
        return;
    }

    router.delete(route('evaluations.destroy', deleteTargetId.value));
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};

const closeDelete = () => {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
};
</script>

<template>
    <Head title="⭐ Evaluations" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-star text-base text-slate-400"></i>
                    Evaluations
                </h2>
                <Link v-if="canEdit" :href="route('evaluations.create', { placement_id: placementId || undefined })" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <i class="fa-solid fa-plus text-xs"></i>
                    New Evaluation
                </Link>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search evaluator or remarks"
                :per-page="perPage"
                :pagination="props.evaluations"
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
                            <th class="px-2 py-2">Evaluator</th>
                            <th class="px-2 py-2">Type</th>
                            <SortableTh label="Period" sort-key="evaluation_period" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Score" sort-key="overall_score" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Evaluated At" sort-key="evaluated_at" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Remarks</th>
                            <th class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="evaluation in props.evaluations.data" :key="evaluation.id" class="table-row">
                            <td class="px-2 py-2">{{ evaluation.evaluator?.name }}</td>
                            <td class="px-2 py-2">
                                <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600">
                                    {{ evaluation.evaluator_type }}
                                </span>
                            </td>
                            <td class="px-2 py-2">
                                <span class="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-indigo-700">
                                    {{ evaluation.evaluation_period }}
                                </span>
                            </td>
                            <td class="px-2 py-2">{{ evaluation.overall_score }}</td>
                            <td class="px-2 py-2">{{ formatDate(evaluation.evaluated_at) }}</td>
                            <td class="px-2 py-2">{{ evaluation.remarks }}</td>
                            <td class="px-2 py-2">
                                <div class="flex gap-1.5">
                                    <button type="button" class="btn-action-rose" @click="requestDelete(evaluation)">
                                        <i class="fa-regular fa-trash-can text-xs"></i>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!props.evaluations.data || props.evaluations.data.length === 0">
                            <td colspan="7" class="py-12 text-center">
                                <div class="empty-state">
                                    <div class="empty-state-icon">
                                        <i class="fa-regular fa-star text-xl"></i>
                                    </div>
                                    <p class="text-sm font-medium text-slate-500">No evaluations found</p>
                                    <p class="text-xs text-slate-400">Select a placement or create an evaluation</p>
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
        title="Delete evaluation"
        message="This will permanently remove the evaluation record."
        confirm-label="Delete"
        @confirm="confirmDelete"
        @close="closeDelete"
    />
</template>
