<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DataTable from '@/Components/DataTable.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import SortableTh from '@/Components/SortableTh.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import { Head, router, useForm } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import { formatDate, formatDuration, formatTime } from '@/utils/formatters';

const props = defineProps({
    placements: Array,
    attendanceLogs: Object,
    filters: Object,
    canApprove: Boolean,
});

const singlePlacement = computed(() => props.placements?.length === 1 ? props.placements[0] : null);

const form = useForm({
    placement_id: singlePlacement.value?.id ?? '',
});

// Keep form in sync if placements load after mount
if (singlePlacement.value) {
    form.placement_id = singlePlacement.value.id;
}

const timeIn = () => form.post(route('attendance.time-in'));
const timeOut = () => form.post(route('attendance.time-out'));

const approveLog = (log) => {
    if (!props.canApprove) return;
    router.patch(route('attendance.approve', log.id));
};

const rejectLog = (log) => {
    if (!props.canApprove) return;
    router.patch(route('attendance.reject', log.id), { preserveScroll: true });
};

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'work_date');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('attendance.index'), {
        search: search.value || undefined,
        per_page: perPage.value || undefined,
        sort: sortKey.value || undefined,
        direction: direction.value || undefined,
        ...options,
    }, { preserveState: true, replace: true });
};

const handleSearch = (value) => { search.value = value; refresh({ page: 1 }); };
const handlePerPage = (value) => { perPage.value = Number(value); refresh({ page: 1 }); };
const handleSort = ({ key, direction: d }) => { sortKey.value = key; direction.value = d; refresh({ page: 1 }); };
</script>

<template>
    <Head title="📅 Attendance" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                <i class="fa-regular fa-calendar-check text-base text-slate-400"></i>
                Attendance Logs
            </h2>
        </template>

        <div class="space-y-4">
            <div class="card card-body">
                <!-- No placements at all -->
                <div v-if="props.placements?.length === 0" class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    You don't have an active placement yet. Time in will be available once your placement is approved.
                </div>

                <!-- Single placement — auto-selected, no dropdown needed -->
                <template v-else-if="singlePlacement">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Logging attendance for</p>
                    <div class="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold">
                            <i class="fa-solid fa-briefcase text-sm"></i>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-slate-900">{{ singlePlacement.company?.name }}</p>
                            <p class="text-xs text-slate-500">{{ singlePlacement.student?.user?.name }}</p>
                        </div>
                        <StatusBadge :status="singlePlacement.status" class="ml-auto" />
                    </div>
                </template>

                <!-- Multiple placements — show dropdown -->
                <template v-else>
                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <i class="fa-solid fa-briefcase text-xs text-slate-400"></i>
                        Select Placement
                    </label>
                    <select v-model="form.placement_id" class="mt-2 block w-full max-w-xl rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="">Select placement</option>
                        <option v-for="placement in props.placements" :key="placement.id" :value="placement.id">
                            {{ placement.student?.user?.name }} — {{ placement.company?.name }}
                        </option>
                    </select>
                </template>

                <!-- Time In / Time Out buttons -->
                <div v-if="props.placements?.length > 0" class="mt-4 flex gap-2">
                    <PrimaryButton :disabled="form.processing || !form.placement_id" @click="timeIn">
                        <i class="fa-solid fa-right-to-bracket mr-2 text-xs"></i>
                        Time In
                    </PrimaryButton>
                    <button
                        type="button"
                        class="inline-flex items-center rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-50"
                        :disabled="form.processing || !form.placement_id"
                        @click="timeOut"
                    >
                        <i class="fa-solid fa-right-from-bracket mr-2 text-xs"></i>
                        Time Out
                    </button>
                </div>
            </div>

            <DataTable
                :search="search"
                search-placeholder="Search student/company"
                :per-page="perPage"
                :pagination="props.attendanceLogs"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <th class="px-2 py-2">Student</th>
                            <SortableTh label="Date" sort-key="work_date" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Time In</th>
                            <th class="px-2 py-2">Time Out</th>
                            <SortableTh label="Duration" sort-key="total_minutes" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Status" sort-key="status" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Approved By</th>
                            <th v-if="props.canApprove" class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in props.attendanceLogs.data" :key="log.id" class="table-row">
                            <td class="px-2 py-2">{{ log.placement?.student?.user?.name }}</td>
                            <td class="px-2 py-2">{{ formatDate(log.work_date) }}</td>
                            <td class="px-2 py-2">{{ formatTime(log.time_in) }}</td>
                            <td class="px-2 py-2">{{ formatTime(log.time_out) }}</td>
                            <td class="px-2 py-2">{{ formatDuration(log.total_minutes) }}</td>
                            <td class="px-2 py-2"><StatusBadge :status="log.status" /></td>
                            <td class="px-2 py-2">{{ log.approver?.name || '-' }}</td>
                            <td v-if="props.canApprove" class="px-2 py-2">
                                <div class="flex flex-wrap gap-1.5">
                                    <button type="button" class="btn-action-emerald disabled:opacity-50" :disabled="log.status === 'approved'" @click="approveLog(log)">
                                        <i class="fa-solid fa-circle-check text-xs"></i>
                                        Approve
                                    </button>
                                    <button type="button" class="btn-action-rose disabled:opacity-50" :disabled="log.status === 'rejected'" @click="rejectLog(log)">
                                        <i class="fa-solid fa-ban text-xs"></i>
                                        Reject
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="props.attendanceLogs.data.length === 0">
                            <td :colspan="props.canApprove ? 8 : 7" class="py-12 text-center">
                                <div class="empty-state">
                                    <div class="empty-state-icon">
                                        <i class="fa-regular fa-calendar-check text-xl"></i>
                                    </div>
                                    <p class="text-sm font-medium text-slate-500">No attendance logs yet</p>
                                    <p class="text-xs text-slate-400">Time in to create your first log</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>
</template>
