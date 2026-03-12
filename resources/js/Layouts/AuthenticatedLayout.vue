<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import ApplicationLogo from '@/Components/ApplicationLogo.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import Dropdown from '@/Components/Dropdown.vue';
import DropdownLink from '@/Components/DropdownLink.vue';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink.vue';

const showingNavigationDropdown = ref(false);
const showLogoutConfirm = ref(false);

const confirmLogout = () => {
    showLogoutConfirm.value = false;
    router.post(route('logout'));
};
const placementsOpen = ref(false);
const dailyReportsOpen = ref(false);
const evaluationsOpen = ref(false);
const documentsOpen = ref(false);
const usersOpen = ref(false);
const studentsOpen = ref(false);
const companiesOpen = ref(false);
const supervisorsOpen = ref(false);
const batchesOpen = ref(false);
const page = usePage();
const role = computed(() => page.props.auth?.user?.role ?? 'student');
const canManage = computed(() => ['admin', 'coordinator'].includes(role.value));
const canAudit = computed(() => role.value === 'admin');
const isPlacementsActive = computed(() => route().current('placements.*'));
const isDailyReportsActive = computed(() => route().current('daily-reports.*') || route().current('weekly-reports.*'));
const isEvaluationsActive = computed(() => route().current('evaluations.*'));
const isDocumentsActive = computed(() => route().current('documents.*'));
const isUsersActive = computed(() => route().current('users.*'));
const isStudentsActive = computed(() => route().current('students.*'));
const isCompaniesActive = computed(() => route().current('companies.*'));
const isSupervisorsActive = computed(() => route().current('supervisors.*'));
const isBatchesActive = computed(() => route().current('batches.*'));
const sidebarQuery = ref('');
const compactMode = ref(false);
const sidebarScrollRef = ref(null);
let sidebarScrollTimer = null;

const isCompact = computed(() => compactMode.value);

const normalizeLabel = (label) => (label || '').toString().toLowerCase();
const matchesLabel = (label) => {
    if (!sidebarQuery.value) {
        return true;
    }
    return normalizeLabel(label).includes(normalizeLabel(sidebarQuery.value));
};
const groupVisible = (labels) => labels.some((label) => matchesLabel(label));

const loadSidebarPrefs = () => {
    try {
        const raw = localStorage.getItem('ojt_sidebar_compact');
        compactMode.value = raw === '1';
    } catch {
        compactMode.value = false;
    }
};

const persistSidebarPrefs = () => {
    try {
        localStorage.setItem('ojt_sidebar_compact', compactMode.value ? '1' : '0');
    } catch {
        // ignore storage failures
    }
};

const loadSidebarScroll = () => {
    try {
        return Number(localStorage.getItem('ojt_sidebar_scroll') || 0);
    } catch {
        return 0;
    }
};

const persistSidebarScroll = (value) => {
    try {
        localStorage.setItem('ojt_sidebar_scroll', String(value || 0));
    } catch {
        // ignore storage failures
    }
};

const restoreSidebarScroll = async () => {
    await nextTick();
    if (!sidebarScrollRef.value) {
        return;
    }
    sidebarScrollRef.value.scrollTop = loadSidebarScroll();
};

const handleSidebarScroll = () => {
    if (!sidebarScrollRef.value) {
        return;
    }
    if (sidebarScrollTimer) {
        clearTimeout(sidebarScrollTimer);
    }
    sidebarScrollTimer = setTimeout(() => {
        persistSidebarScroll(sidebarScrollRef.value.scrollTop);
    }, 120);
};

const toasts = ref([]);
const seenNotificationIds = ref(new Set());

const loadSeenNotifications = () => {
    try {
        const raw = localStorage.getItem('ojt_seen_notifications');
        const ids = raw ? JSON.parse(raw) : [];
        seenNotificationIds.value = new Set(Array.isArray(ids) ? ids : []);
    } catch {
        seenNotificationIds.value = new Set();
    }
};

const persistSeenNotifications = () => {
    try {
        const ids = Array.from(seenNotificationIds.value);
        localStorage.setItem('ojt_seen_notifications', JSON.stringify(ids.slice(-200)));
    } catch {
        // ignore storage failures
    }
};

loadSeenNotifications();

const processUnreadNotifications = (unread) => {
    if (!Array.isArray(unread)) {
        return;
    }

    unread.forEach((notification) => {
        if (!notification?.id || seenNotificationIds.value.has(notification.id)) {
            return;
        }

        const type = notification.type === 'success'
            ? 'success'
            : notification.type === 'error'
                ? 'error'
                : 'info';

        pushToast(type, `${notification.title} - ${notification.body}`);
        seenNotificationIds.value.add(notification.id);
    });

    persistSeenNotifications();
};

let pollTimer = null;

const pollNotifications = async () => {
    if (!window.route) {
        return;
    }

    try {
        const response = await fetch(route('notifications.unread'), {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return;
        }

        const payload = await response.json();
        processUnreadNotifications(payload?.data || []);
    } catch {
        // ignore polling errors
    }
};

const pushToast = (type, message) => {
    if (!message) {
        return;
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    toasts.value.push({ id, type, message });

    setTimeout(() => {
        toasts.value = toasts.value.filter((toast) => toast.id !== id);
    }, 3500);
};

watch(
    () => page.props.notifications?.unread,
    (unread) => {
        processUnreadNotifications(unread);
    },
    { immediate: true },
);

onMounted(() => {
    loadSidebarPrefs();
    restoreSidebarScroll();
    pollNotifications();
    pollTimer = setInterval(pollNotifications, 45000);
});

watch(
    () => compactMode.value,
    () => {
        persistSidebarPrefs();
    },
);

watch(
    () => page.url,
    () => {
        restoreSidebarScroll();
    },
);

onUnmounted(() => {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
});
</script>

<template>
    <div class="h-screen overflow-hidden bg-slate-50 text-slate-900">
        <Head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link
                href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        </Head>

        <div class="relative h-screen overflow-hidden">
            <div
                class="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_circle_at_12%_10%,#DCFCE7_0%,transparent_45%),radial-gradient(900px_circle_at_85%_5%,#FEF3C7_0%,transparent_40%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)]"
            ></div>
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(90deg,rgba(15,23,42,0.12)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:48px_48px]"
            ></div>

            <div class="relative flex h-screen">
                <aside class="hidden w-72 flex-col border-r border-slate-200/70 bg-white/70 shadow-sm backdrop-blur lg:fixed lg:inset-y-0 lg:flex">
                    <div class="flex items-center gap-3 border-b border-slate-200/70 px-6 py-5">
                        <Link :href="route('dashboard')" class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                <ApplicationLogo class="h-6 w-6 fill-current" />
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">OJT Tracker</div>
                                <div class="text-xs text-slate-500" style="font-family: 'Manrope', sans-serif;">On-the-job training</div>
                            </div>
                        </Link>
                    </div>

                    <div ref="sidebarScrollRef" class="flex-1 overflow-y-auto px-4 py-5" @scroll="handleSidebarScroll">
                        <div class="mb-4">
                            <div class="relative">
                                <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                                <input
                                    v-model="sidebarQuery"
                                    type="search"
                                    placeholder="Quick switch"
                                    class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                                />
                            </div>
                        </div>
                        <div :class="isCompact ? 'space-y-1 text-[13px]' : 'space-y-2 text-sm'">
                            <div v-show="groupVisible(['Dashboard', 'Placements', 'All Placements', 'New Placement', 'Request Placement', 'Attendance', 'Reports', 'Daily Reports', 'New Daily Report', 'Weekly Reports', 'New Weekly Report', 'Evaluations', 'All Evaluations', 'New Evaluation', 'Documents', 'All Documents', 'Upload Document'])" class="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Core
                            </div>
                            <ResponsiveNavLink v-show="matchesLabel('Dashboard')" :href="route('dashboard')" :active="route().current('dashboard')">
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-solid fa-house text-base"></i>
                                </span>
                                <span>Dashboard</span>
                            </ResponsiveNavLink>
                            <div v-show="groupVisible(['Placements', 'All Placements', 'New Placement', 'Request Placement'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isPlacementsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="placementsOpen = !placementsOpen"
                                    :title="placementsOpen || isPlacementsActive ? '' : 'All Placements, New Placement'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-briefcase text-base"></i>
                                    </span>
                                    <span class="flex-1">Placements</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="placementsOpen || isPlacementsActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="placementsOpen || isPlacementsActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Placements')" :href="route('placements.index')" :active="route().current('placements.index')" :class="route().current('placements.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Placements</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-if="role === 'student' && matchesLabel('Request Placement')" :href="route('placements.request')" :active="route().current('placements.request')" :class="route().current('placements.request') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                            <i class="fa-solid fa-paper-plane text-xs"></i>
                                        </span>
                                        <span>Request Placement</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-if="canManage && matchesLabel('New Placement')" :href="route('placements.create')" :active="route().current('placements.create')" :class="route().current('placements.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>New Placement</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <ResponsiveNavLink v-show="matchesLabel('Attendance')" :href="route('attendance.index')" :active="route().current('attendance.*')">
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-calendar-check text-base"></i>
                                </span>
                                <span>Attendance</span>
                            </ResponsiveNavLink>
                            <ResponsiveNavLink v-show="matchesLabel('DTR Generator')" :href="route('dtr.index')" :active="route().current('dtr.*')">
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-file-lines text-base"></i>
                                </span>
                                <span>DTR Generator</span>
                            </ResponsiveNavLink>
                            <div v-show="groupVisible(['Reports', 'Daily Reports', 'New Daily Report', 'Weekly Reports', 'New Weekly Report'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isDailyReportsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="dailyReportsOpen = !dailyReportsOpen"
                                    :title="dailyReportsOpen || isDailyReportsActive ? '' : 'Daily Reports, Weekly Reports'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-clipboard text-base"></i>
                                    </span>
                                    <span class="flex-1">Reports</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="dailyReportsOpen || isDailyReportsActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="dailyReportsOpen || isDailyReportsActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('Daily Reports')" :href="route('daily-reports.index')" :active="route().current('daily-reports.index')" :class="route().current('daily-reports.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>Daily Reports</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New Daily Report')" :href="route('daily-reports.create')" :active="route().current('daily-reports.create')" :class="route().current('daily-reports.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>New Daily Report</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('Weekly Reports')" :href="route('weekly-reports.index')" :active="route().current('weekly-reports.index')" :class="route().current('weekly-reports.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-regular fa-calendar text-xs"></i>
                                        </span>
                                        <span>Weekly Reports</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New Weekly Report')" :href="route('weekly-reports.create')" :active="route().current('weekly-reports.create')" :class="route().current('weekly-reports.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>New Weekly Report</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <div v-show="groupVisible(['Evaluations', 'All Evaluations', 'New Evaluation'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isEvaluationsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="evaluationsOpen = !evaluationsOpen"
                                    :title="evaluationsOpen || isEvaluationsActive ? '' : 'All Evaluations, New Evaluation'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-star text-base"></i>
                                    </span>
                                    <span class="flex-1">Evaluations</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="evaluationsOpen || isEvaluationsActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="evaluationsOpen || isEvaluationsActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Evaluations')" :href="route('evaluations.index')" :active="route().current('evaluations.index')" :class="route().current('evaluations.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Evaluations</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New Evaluation')" :href="route('evaluations.create')" :active="route().current('evaluations.create')" :class="route().current('evaluations.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>New Evaluation</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <div v-show="groupVisible(['Documents', 'All Documents', 'Upload Document'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isDocumentsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="documentsOpen = !documentsOpen"
                                    :title="documentsOpen || isDocumentsActive ? '' : 'All Documents, Upload Document'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-file-lines text-base"></i>
                                    </span>
                                    <span class="flex-1">Documents</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="documentsOpen || isDocumentsActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="documentsOpen || isDocumentsActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Documents')" :href="route('documents.index')" :active="route().current('documents.index')" :class="route().current('documents.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Documents</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('Upload Document')" :href="route('documents.create')" :active="route().current('documents.create')" :class="route().current('documents.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>Upload Document</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <div v-show="groupVisible(['Notifications', 'Reports'])" class="px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Insights
                            </div>
                            <ResponsiveNavLink v-show="matchesLabel('Notifications')" :href="route('notifications.index')" :active="route().current('notifications.*')">
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-bell text-base"></i>
                                </span>
                                <span>Notifications</span>
                            </ResponsiveNavLink>
                            <ResponsiveNavLink v-show="matchesLabel('Reports')" :href="route('reports.index')" :active="route().current('reports.*')">
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-solid fa-chart-column text-base"></i>
                                </span>
                                <span>Reports</span>
                            </ResponsiveNavLink>
                        <div v-show="canManage && groupVisible(['Users', 'All Users', 'New User', 'Students', 'All Students', 'New Student', 'Companies', 'All Companies', 'New Company', 'Supervisors', 'All Supervisors', 'New Supervisor', 'Batches', 'All Batches', 'New Batch', 'Audit Logs'])" class="px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Admin
                        </div>
                            <div v-if="canManage && groupVisible(['Users', 'All Users', 'New User'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isUsersActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="usersOpen = !usersOpen"
                                    :title="usersOpen || isUsersActive ? '' : 'All Users, New User'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-user text-base"></i>
                                    </span>
                                    <span class="flex-1">Users</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="usersOpen || isUsersActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="usersOpen || isUsersActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Users')" :href="route('users.index')" :active="route().current('users.index')" :class="route().current('users.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Users</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New User')" :href="route('users.create')" :active="route().current('users.create')" :class="route().current('users.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-user-plus text-xs"></i>
                                        </span>
                                        <span>New User</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <div v-if="canManage && groupVisible(['Students', 'All Students', 'New Student'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isStudentsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="studentsOpen = !studentsOpen"
                                    :title="studentsOpen || isStudentsActive ? '' : 'All Students, New Student'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-graduation-cap text-base"></i>
                                    </span>
                                    <span class="flex-1">Students</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="studentsOpen || isStudentsActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="studentsOpen || isStudentsActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Students')" :href="route('students.index')" :active="route().current('students.index')" :class="route().current('students.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Students</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New Student')" :href="route('students.create')" :active="route().current('students.create')" :class="route().current('students.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-user-plus text-xs"></i>
                                        </span>
                                        <span>New Student</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <div v-if="canManage && groupVisible(['Companies', 'All Companies', 'New Company'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isCompaniesActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="companiesOpen = !companiesOpen"
                                    :title="companiesOpen || isCompaniesActive ? '' : 'All Companies, New Company'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-building text-base"></i>
                                    </span>
                                    <span class="flex-1">Companies</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="companiesOpen || isCompaniesActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="companiesOpen || isCompaniesActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Companies')" :href="route('companies.index')" :active="route().current('companies.index')" :class="route().current('companies.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Companies</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New Company')" :href="route('companies.create')" :active="route().current('companies.create')" :class="route().current('companies.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>New Company</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <div v-if="canManage && groupVisible(['Batches', 'All Batches', 'New Batch'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isBatchesActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="batchesOpen = !batchesOpen"
                                    :title="batchesOpen || isBatchesActive ? '' : 'All Batches, New Batch'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-calendar text-base"></i>
                                    </span>
                                    <span class="flex-1">Batches</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="batchesOpen || isBatchesActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="batchesOpen || isBatchesActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Batches')" :href="route('batches.index')" :active="route().current('batches.index')" :class="route().current('batches.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Batches</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New Batch')" :href="route('batches.create')" :active="route().current('batches.create')" :class="route().current('batches.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>New Batch</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <div v-if="canManage && groupVisible(['Supervisors', 'All Supervisors', 'New Supervisor'])" class="space-y-2">
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                    :class="isSupervisorsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                    @click="supervisorsOpen = !supervisorsOpen"
                                    :title="supervisorsOpen || isSupervisorsActive ? '' : 'All Supervisors, New Supervisor'"
                                >
                                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-id-badge text-base"></i>
                                    </span>
                                    <span class="flex-1">Supervisors</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="supervisorsOpen || isSupervisorsActive ? 'rotate-180' : ''"></i>
                                </button>
                                <div v-show="supervisorsOpen || isSupervisorsActive" class="ml-12 space-y-2">
                                    <ResponsiveNavLink v-show="matchesLabel('All Supervisors')" :href="route('supervisors.index')" :active="route().current('supervisors.index')" :class="route().current('supervisors.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-list text-xs"></i>
                                        </span>
                                        <span>All Supervisors</span>
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink v-show="matchesLabel('New Supervisor')" :href="route('supervisors.create')" :active="route().current('supervisors.create')" :class="route().current('supervisors.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <i class="fa-solid fa-plus text-xs"></i>
                                        </span>
                                        <span>New Supervisor</span>
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                            <ResponsiveNavLink v-if="canAudit && matchesLabel('Audit Logs')" :href="route('audit-logs.index')" :active="route().current('audit-logs.*')">
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-solid fa-shield-halved text-base"></i>
                                </span>
                                <span>Audit Logs</span>
                            </ResponsiveNavLink>
                        </div>
                    </div>
                    <div class="border-t border-slate-200/70 px-6 py-4 text-xs text-slate-500">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <div class="font-semibold text-slate-700">OJT Tracker</div>
                                <div>Administrative Console</div>
                            </div>
                            <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900" @click="compactMode = !compactMode">
                                <i class="fa-solid" :class="compactMode ? 'fa-expand' : 'fa-compress'"></i>
                                {{ compactMode ? 'Default' : 'Compact' }}
                            </button>
                        </div>
                    </div>
                </aside>

                <div class="flex h-screen flex-1 flex-col lg:ml-72">
                    <div class="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur lg:hidden">
                        <button @click="showingNavigationDropdown = true" class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 hover:text-slate-900">
                            <i class="fa-solid fa-bars text-lg"></i>
                        </button>
                        <Link :href="route('dashboard')" class="flex items-center gap-2">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                                <ApplicationLogo class="h-5 w-5 fill-current" />
                            </div>
                            <span class="text-sm font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">OJT Tracker</span>
                        </Link>
                        <Dropdown align="right" width="48" contentClasses="py-2 bg-white/95">
                            <template #trigger>
                                <span class="inline-flex rounded-xl">
                                    <button type="button" class="inline-flex items-center rounded-xl border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium text-slate-700">
                                        {{ $page.props.auth.user.name }}
                                    </button>
                                </span>
                            </template>

                            <template #content>
                                <DropdownLink :href="route('profile.edit')">Profile</DropdownLink>
                                <button type="button" @click="showLogoutConfirm = true" class="block w-full px-4 py-2 text-left text-sm leading-5 text-slate-700 hover:bg-slate-100 focus:outline-none">Log Out</button>
                            </template>
                        </Dropdown>
                    </div>

                    <div class="fixed left-0 right-0 top-0 z-20 hidden h-20 items-center justify-between border-b border-slate-200/70 bg-white/70 px-8 backdrop-blur lg:flex lg:left-72">
                        <div class="flex items-center gap-3">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white" style="font-family: 'Space Grotesk', sans-serif;">
                                {{ $page.props.auth.user.name?.charAt(0)?.toUpperCase() ?? '?' }}
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-slate-900">{{ $page.props.auth.user.name }}</div>
                                <div class="mt-0.5 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    <i class="fa-solid fa-circle-user text-[9px]"></i>
                                    {{ $page.props.auth.user.role ?? 'user' }}
                                </div>
                            </div>
                        </div>
                        <Dropdown align="right" width="48" contentClasses="py-2 bg-white/95">
                            <template #trigger>
                                <span class="inline-flex rounded-xl">
                                    <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white">
                                        <i class="fa-solid fa-user-gear text-sm text-slate-500"></i>
                                        Account
                                        <i class="fa-solid fa-chevron-down text-xs text-slate-400"></i>
                                    </button>
                                </span>
                            </template>

                            <template #content>
                                <DropdownLink :href="route('profile.edit')">
                                    <i class="fa-regular fa-user mr-2 text-slate-400"></i>Profile
                                </DropdownLink>
                                <button type="button" @click="showLogoutConfirm = true" class="block w-full px-4 py-2 text-left text-sm leading-5 text-slate-700 hover:bg-slate-100 focus:outline-none">
                                    <i class="fa-solid fa-arrow-right-from-bracket mr-2 text-slate-400"></i>Log Out
                                </button>
                            </template>
                        </Dropdown>
                    </div>

                    <main class="flex-1 overflow-y-auto px-6 pb-8 pt-20 lg:px-10 lg:pt-24">
                        <div class="mx-auto w-full max-w-6xl">
                            <div v-if="$slots.header" class="mb-6 rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm">
                                <slot name="header" />
                            </div>

                            <slot />
                        </div>
                    </main>
                </div>
            </div>

            <div class="fixed bottom-6 right-6 z-50 flex w-[340px] flex-col gap-2">
                <transition-group
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="opacity-0 translate-x-4"
                    enter-to-class="opacity-100 translate-x-0"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="opacity-100 translate-x-0"
                    leave-to-class="opacity-0 translate-x-4"
                    tag="div"
                    class="flex flex-col gap-2"
                >
                <div
                    v-for="toast in toasts"
                    :key="toast.id"
                    class="overflow-hidden rounded-2xl border bg-white shadow-lg"
                    :class="{
                        'border-emerald-200': toast.type === 'success',
                        'border-rose-200': toast.type === 'error',
                        'border-slate-200': toast.type === 'info',
                    }"
                >
                    <div class="flex items-start gap-3 px-4 py-3">
                        <span
                            class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                            :class="{
                                'bg-emerald-100 text-emerald-600': toast.type === 'success',
                                'bg-rose-100 text-rose-600': toast.type === 'error',
                                'bg-sky-100 text-sky-600': toast.type === 'info',
                            }"
                        >
                            <i
                                :class="{
                                    'fa-solid fa-circle-check': toast.type === 'success',
                                    'fa-solid fa-circle-xmark': toast.type === 'error',
                                    'fa-solid fa-circle-info': toast.type === 'info',
                                }"
                            ></i>
                        </span>
                        <div class="min-w-0 flex-1">
                            <div
                                class="text-xs font-bold uppercase tracking-widest"
                                :class="{
                                    'text-emerald-700': toast.type === 'success',
                                    'text-rose-700': toast.type === 'error',
                                    'text-sky-700': toast.type === 'info',
                                }"
                            >{{ toast.type }}</div>
                            <div class="mt-0.5 text-sm text-slate-700">{{ toast.message }}</div>
                        </div>
                    </div>
                    <div
                        class="h-1"
                        :class="{
                            'bg-emerald-100': toast.type === 'success',
                            'bg-rose-100': toast.type === 'error',
                            'bg-sky-100': toast.type === 'info',
                        }"
                    >
                        <div
                            class="h-full"
                            :class="{
                                'bg-emerald-400': toast.type === 'success',
                                'bg-rose-400': toast.type === 'error',
                                'bg-sky-400': toast.type === 'info',
                            }"
                            style="animation: progress-shrink 3.5s linear forwards;"
                        ></div>
                    </div>
                </div>
                </transition-group>
            </div>

            <div v-if="showingNavigationDropdown" class="fixed inset-0 z-40 lg:hidden">
                <div class="absolute inset-0 bg-slate-900/40" @click="showingNavigationDropdown = false"></div>
                <div class="relative h-full w-72 bg-white/95 shadow-2xl">
                    <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                        <Link :href="route('dashboard')" class="flex items-center gap-2" @click="showingNavigationDropdown = false">
                            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
                                <ApplicationLogo class="h-5 w-5 fill-current" />
                            </div>
                            <span class="text-sm font-semibold text-slate-900" style="font-family: 'Space Grotesk', sans-serif;">OJT Tracker</span>
                        </Link>
                        <button @click="showingNavigationDropdown = false" class="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 hover:text-slate-900">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <div class="px-4 py-4">
                        <div class="mb-4">
                            <div class="relative">
                                <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                                <input
                                    v-model="sidebarQuery"
                                    type="search"
                                    placeholder="Quick switch"
                                    class="w-full rounded-xl border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                                />
                            </div>
                        </div>
                        <div :class="isCompact ? 'space-y-1 text-[13px]' : 'space-y-2 text-sm'">
                        <div v-show="groupVisible(['Dashboard', 'Placements', 'All Placements', 'New Placement', 'Request Placement', 'Attendance', 'Reports', 'Daily Reports', 'New Daily Report', 'Weekly Reports', 'New Weekly Report', 'Evaluations', 'All Evaluations', 'New Evaluation', 'Documents', 'All Documents', 'Upload Document'])" class="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Core
                        </div>
                        <ResponsiveNavLink v-show="matchesLabel('Dashboard')" :href="route('dashboard')" :active="route().current('dashboard')" @click="showingNavigationDropdown = false">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <i class="fa-solid fa-house text-base"></i>
                            </span>
                            <span>Dashboard</span>
                        </ResponsiveNavLink>
                        <div v-show="groupVisible(['Placements', 'All Placements', 'New Placement', 'Request Placement'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isPlacementsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="placementsOpen = !placementsOpen"
                                :title="placementsOpen || isPlacementsActive ? '' : 'All Placements, New Placement'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-solid fa-briefcase text-base"></i>
                                </span>
                                <span class="flex-1">Placements</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="placementsOpen || isPlacementsActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="placementsOpen || isPlacementsActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Placements')" :href="route('placements.index')" :active="route().current('placements.index')" @click="showingNavigationDropdown = false" :class="route().current('placements.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Placements</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-if="role === 'student' && matchesLabel('Request Placement')" :href="route('placements.request')" :active="route().current('placements.request')" @click="showingNavigationDropdown = false" :class="route().current('placements.request') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <i class="fa-solid fa-paper-plane text-xs"></i>
                                    </span>
                                    <span>Request Placement</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-if="canManage && matchesLabel('New Placement')" :href="route('placements.create')" :active="route().current('placements.create')" @click="showingNavigationDropdown = false" :class="route().current('placements.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>New Placement</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <ResponsiveNavLink v-show="matchesLabel('Attendance')" :href="route('attendance.index')" :active="route().current('attendance.*')" @click="showingNavigationDropdown = false">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <i class="fa-regular fa-calendar-check text-base"></i>
                            </span>
                            <span>Attendance</span>
                        </ResponsiveNavLink>
                        <div v-show="groupVisible(['Reports', 'Daily Reports', 'New Daily Report', 'Weekly Reports', 'New Weekly Report'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isDailyReportsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="dailyReportsOpen = !dailyReportsOpen"
                                :title="dailyReportsOpen || isDailyReportsActive ? '' : 'Daily Reports, Weekly Reports'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-clipboard text-base"></i>
                                </span>
                                <span class="flex-1">Reports</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="dailyReportsOpen || isDailyReportsActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="dailyReportsOpen || isDailyReportsActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('Daily Reports')" :href="route('daily-reports.index')" :active="route().current('daily-reports.index')" @click="showingNavigationDropdown = false" :class="route().current('daily-reports.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>Daily Reports</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New Daily Report')" :href="route('daily-reports.create')" :active="route().current('daily-reports.create')" @click="showingNavigationDropdown = false" :class="route().current('daily-reports.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>New Daily Report</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('Weekly Reports')" :href="route('weekly-reports.index')" :active="route().current('weekly-reports.index')" @click="showingNavigationDropdown = false" :class="route().current('weekly-reports.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-regular fa-calendar text-xs"></i>
                                    </span>
                                    <span>Weekly Reports</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New Weekly Report')" :href="route('weekly-reports.create')" :active="route().current('weekly-reports.create')" @click="showingNavigationDropdown = false" :class="route().current('weekly-reports.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>New Weekly Report</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <div v-show="groupVisible(['Evaluations', 'All Evaluations', 'New Evaluation'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isEvaluationsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="evaluationsOpen = !evaluationsOpen"
                                :title="evaluationsOpen || isEvaluationsActive ? '' : 'All Evaluations, New Evaluation'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-star text-base"></i>
                                </span>
                                <span class="flex-1">Evaluations</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="evaluationsOpen || isEvaluationsActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="evaluationsOpen || isEvaluationsActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Evaluations')" :href="route('evaluations.index')" :active="route().current('evaluations.index')" @click="showingNavigationDropdown = false" :class="route().current('evaluations.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Evaluations</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New Evaluation')" :href="route('evaluations.create')" :active="route().current('evaluations.create')" @click="showingNavigationDropdown = false" :class="route().current('evaluations.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>New Evaluation</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <div v-show="groupVisible(['Documents', 'All Documents', 'Upload Document'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isDocumentsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="documentsOpen = !documentsOpen"
                                :title="documentsOpen || isDocumentsActive ? '' : 'All Documents, Upload Document'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-file-lines text-base"></i>
                                </span>
                                <span class="flex-1">Documents</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="documentsOpen || isDocumentsActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="documentsOpen || isDocumentsActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Documents')" :href="route('documents.index')" :active="route().current('documents.index')" @click="showingNavigationDropdown = false" :class="route().current('documents.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Documents</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('Upload Document')" :href="route('documents.create')" :active="route().current('documents.create')" @click="showingNavigationDropdown = false" :class="route().current('documents.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>Upload Document</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <div v-show="groupVisible(['Notifications', 'Reports'])" class="px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Insights
                        </div>
                        <ResponsiveNavLink v-show="matchesLabel('Notifications')" :href="route('notifications.index')" :active="route().current('notifications.*')" @click="showingNavigationDropdown = false">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <i class="fa-regular fa-bell text-base"></i>
                            </span>
                            <span>Notifications</span>
                        </ResponsiveNavLink>
                        <ResponsiveNavLink v-show="matchesLabel('Reports')" :href="route('reports.index')" :active="route().current('reports.*')" @click="showingNavigationDropdown = false">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <i class="fa-solid fa-chart-column text-base"></i>
                            </span>
                            <span>Reports</span>
                        </ResponsiveNavLink>
                        <div v-show="canManage && groupVisible(['Users', 'All Users', 'New User', 'Students', 'All Students', 'New Student', 'Companies', 'All Companies', 'New Company', 'Supervisors', 'All Supervisors', 'New Supervisor', 'Batches', 'All Batches', 'New Batch', 'Audit Logs'])" class="px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Admin
                        </div>
                        <div v-if="canManage && groupVisible(['Users', 'All Users', 'New User'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isUsersActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="usersOpen = !usersOpen"
                                :title="usersOpen || isUsersActive ? '' : 'All Users, New User'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-user text-base"></i>
                                </span>
                                <span class="flex-1">Users</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="usersOpen || isUsersActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="usersOpen || isUsersActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Users')" :href="route('users.index')" :active="route().current('users.index')" @click="showingNavigationDropdown = false" :class="route().current('users.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Users</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New User')" :href="route('users.create')" :active="route().current('users.create')" @click="showingNavigationDropdown = false" :class="route().current('users.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-user-plus text-xs"></i>
                                    </span>
                                    <span>New User</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <div v-if="canManage && groupVisible(['Students', 'All Students', 'New Student'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isStudentsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="studentsOpen = !studentsOpen"
                                :title="studentsOpen || isStudentsActive ? '' : 'All Students, New Student'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-solid fa-graduation-cap text-base"></i>
                                </span>
                                <span class="flex-1">Students</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="studentsOpen || isStudentsActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="studentsOpen || isStudentsActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Students')" :href="route('students.index')" :active="route().current('students.index')" @click="showingNavigationDropdown = false" :class="route().current('students.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Students</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New Student')" :href="route('students.create')" :active="route().current('students.create')" @click="showingNavigationDropdown = false" :class="route().current('students.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-user-plus text-xs"></i>
                                    </span>
                                    <span>New Student</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <div v-if="canManage && groupVisible(['Companies', 'All Companies', 'New Company'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isCompaniesActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="companiesOpen = !companiesOpen"
                                :title="companiesOpen || isCompaniesActive ? '' : 'All Companies, New Company'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-building text-base"></i>
                                </span>
                                <span class="flex-1">Companies</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="companiesOpen || isCompaniesActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="companiesOpen || isCompaniesActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Companies')" :href="route('companies.index')" :active="route().current('companies.index')" @click="showingNavigationDropdown = false" :class="route().current('companies.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Companies</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New Company')" :href="route('companies.create')" :active="route().current('companies.create')" @click="showingNavigationDropdown = false" :class="route().current('companies.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>New Company</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <div v-if="canManage && groupVisible(['Batches', 'All Batches', 'New Batch'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isBatchesActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="batchesOpen = !batchesOpen"
                                :title="batchesOpen || isBatchesActive ? '' : 'All Batches, New Batch'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-calendar text-base"></i>
                                </span>
                                <span class="flex-1">Batches</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="batchesOpen || isBatchesActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="batchesOpen || isBatchesActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Batches')" :href="route('batches.index')" :active="route().current('batches.index')" @click="showingNavigationDropdown = false" :class="route().current('batches.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Batches</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New Batch')" :href="route('batches.create')" :active="route().current('batches.create')" @click="showingNavigationDropdown = false" :class="route().current('batches.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>New Batch</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <div v-if="canManage && groupVisible(['Supervisors', 'All Supervisors', 'New Supervisor'])" class="space-y-2">
                            <button
                                type="button"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition hover:bg-white/70 hover:text-slate-900"
                                :class="isSupervisorsActive ? 'bg-white/90 text-slate-900 shadow-sm ring-1 ring-emerald-200/70 border-l-2 border-emerald-500 pl-3' : 'text-slate-600'"
                                @click="supervisorsOpen = !supervisorsOpen"
                                :title="supervisorsOpen || isSupervisorsActive ? '' : 'All Supervisors, New Supervisor'"
                            >
                                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <i class="fa-regular fa-id-badge text-base"></i>
                                </span>
                                <span class="flex-1">Supervisors</span>
                                <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition" :class="supervisorsOpen || isSupervisorsActive ? 'rotate-180' : ''"></i>
                            </button>
                            <div v-show="supervisorsOpen || isSupervisorsActive" class="ml-12 space-y-2">
                                <ResponsiveNavLink v-show="matchesLabel('All Supervisors')" :href="route('supervisors.index')" :active="route().current('supervisors.index')" @click="showingNavigationDropdown = false" :class="route().current('supervisors.index') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-list text-xs"></i>
                                    </span>
                                    <span>All Supervisors</span>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink v-show="matchesLabel('New Supervisor')" :href="route('supervisors.create')" :active="route().current('supervisors.create')" @click="showingNavigationDropdown = false" :class="route().current('supervisors.create') ? 'border-l-2 border-emerald-500 pl-2' : ''">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </span>
                                    <span>New Supervisor</span>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                        <ResponsiveNavLink v-if="canAudit && matchesLabel('Audit Logs')" :href="route('audit-logs.index')" :active="route().current('audit-logs.*')" @click="showingNavigationDropdown = false">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <i class="fa-solid fa-shield-halved text-base"></i>
                            </span>
                            <span>Audit Logs</span>
                        </ResponsiveNavLink>
                    </div>
                    <div class="border-t border-slate-200 px-4 py-4 text-xs text-slate-500">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <div class="font-semibold text-slate-700">OJT Tracker</div>
                                <div>Administrative Console</div>
                            </div>
                            <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900" @click="compactMode = !compactMode">
                                <i class="fa-solid" :class="compactMode ? 'fa-expand' : 'fa-compress'"></i>
                                {{ compactMode ? 'Default' : 'Compact' }}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
    </div>

    <ConfirmDialog
        :show="showLogoutConfirm"
        title="Log out?"
        message="Are you sure you want to log out of your account?"
        confirm-label="Log Out"
        cancel-label="Stay"
        tone="warning"
        @confirm="confirmLogout"
        @close="showLogoutConfirm = false"
    />
</template>
