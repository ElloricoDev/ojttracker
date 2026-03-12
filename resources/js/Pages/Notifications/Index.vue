<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DataTable from '@/Components/DataTable.vue';
import SortableTh from '@/Components/SortableTh.vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import { formatDateTime } from '@/utils/formatters';

const props = defineProps({
    notifications: Object,
    filters: Object,
});

const search = ref(props.filters?.search || '');
const perPage = ref(props.filters?.per_page || 10);
const sortKey = ref(props.filters?.sort || 'created_at');
const direction = ref(props.filters?.direction || 'desc');

const refresh = (options = {}) => {
    router.get(route('notifications.index'), {
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

const markRead = (notification) => {
    router.patch(route('notifications.read', notification.id));
};

const markAllRead = () => {
    router.patch(route('notifications.read-all'));
};
</script>

<template>
    <Head title="🔔 Notifications" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-bell text-base text-slate-400"></i>
                    Notifications
                </h2>
                <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" @click="markAllRead">
                    <i class="fa-solid fa-check-double text-xs"></i>
                    Mark All Read
                </button>
            </div>
        </template>

        <div class="space-y-4">
            <DataTable
                :search="search"
                search-placeholder="Search notifications"
                :per-page="perPage"
                :pagination="props.notifications"
                @search="handleSearch"
                @per-page="handlePerPage"
            >
                <template #table>
                    <thead>
                        <tr class="table-head">
                            <th class="px-2 py-2">Title</th>
                            <th class="px-2 py-2">Message</th>
                            <th class="px-2 py-2">Status</th>
                            <SortableTh label="Created" sort-key="created_at" :active-sort="sortKey" :direction="direction" @sort="handleSort" />
                            <th class="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="notification in props.notifications.data" :key="notification.id" class="table-row">
                            <td class="px-2 py-2 font-semibold text-slate-900">{{ notification.title }}</td>
                            <td class="px-2 py-2 text-slate-600">{{ notification.body }}</td>
                            <td class="px-2 py-2">
                                <span v-if="!notification.read_at" class="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">New</span>
                                <span v-else class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Read</span>
                            </td>
                            <td class="px-2 py-2 text-slate-500">{{ formatDateTime(notification.created_at) }}</td>
                            <td class="px-2 py-2">
                                <div class="flex flex-wrap gap-2">
                                    <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" :disabled="!!notification.read_at" @click="markRead(notification)">
                                        <i class="fa-regular fa-envelope-open text-xs"></i>
                                        Mark read
                                    </button>
                                    <Link v-if="notification.url" :href="notification.url" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                        <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                        Open
                                    </Link>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!props.notifications.data || props.notifications.data.length === 0">
                            <td colspan="5" class="px-2 py-4 text-center text-slate-500">No notifications yet.</td>
                        </tr>
                    </tbody>
                </template>
            </DataTable>
        </div>
    </AuthenticatedLayout>
</template>
