<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatDateTime } from '@/utils/formatters';

const props = defineProps({
    logs: Object,
    filters: Object,
});

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'created_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('audit-logs.index'), {
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
    <Head title="🔍 Audit Logs" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                <i class="fa-solid fa-shield-halved text-base text-slate-400"></i>
                Audit Logs
            </h2>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search action, user, entity"
                :per-page="perPage"
                :pagination="logs"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <SortableTh label="Date" sort-key="created_at" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">User</th>
                            <SortableTh label="Action" sort-key="action" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <SortableTh label="Entity" sort-key="entity_type" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Metadata</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in logs.data" :key="log.id" class="table-row">
                            <td class="px-2 py-2">{{ formatDateTime(log.created_at) }}</td>
                            <td class="px-2 py-2">
                                <div>{{ log.user?.name || '-' }}</div>
                                <div class="text-xs text-slate-500">{{ log.user?.email }}</div>
                            </td>
                            <td class="px-2 py-2">{{ log.action }}</td>
                            <td class="px-2 py-2">{{ log.entity_type }} #{{ log.entity_id }}</td>
                            <td class="px-2 py-2">
                                <pre class="whitespace-pre-wrap text-xs text-slate-600">{{ JSON.stringify(log.metadata, null, 2) }}</pre>
                            </td>
                        </tr>
                        <tr v-if="logs.data.length === 0">
                            <td colspan="5" class="px-2 py-4 text-center text-slate-500">No audit logs found.</td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>
</template>
