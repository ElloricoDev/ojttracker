<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import axios from 'axios';

const props = defineProps({
    placements: Array,
});

const now = new Date();
const placementId = ref(props.placements?.[0]?.id ?? '');
const month = ref(now.getMonth() + 1);
const year  = ref(now.getFullYear());
const dtr   = ref(null);
const loading = ref(false);
const errorMsg = ref('');

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];
const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

const monthName = computed(() => MONTHS[(dtr.value?.month ?? month.value) - 1]);

// Assign AM/PM columns using browser local time (auto-handles UTC → local)
const processDay = (day) => {
    const timeIn  = day.time_in  ? new Date(day.time_in)  : null;
    const timeOut = day.time_out ? new Date(day.time_out) : null;

    let amArrival = null, amDeparture = null, pmArrival = null, pmDeparture = null;

    if (timeIn) {
        if (timeIn.getHours() < 12) { amArrival  = timeIn;  }
        else                         { pmArrival  = timeIn;  }
    }
    if (timeOut) {
        if (timeOut.getHours() < 12) { amDeparture = timeOut; }
        else                          { pmDeparture = timeOut; }
    }

    return { ...day, amArrival, amDeparture, pmArrival, pmDeparture };
};

const processedDays = computed(() => (dtr.value?.days ?? []).map(processDay));

// Format Date object → HH:MM (24-hr, for the DTR table cells)
const fmt = (d) => {
    if (!d) return '';
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const generate = async () => {
    if (!placementId.value) return;
    loading.value = true;
    errorMsg.value = '';
    dtr.value = null;
    try {
        const { data } = await axios.get(route('dtr.generate'), {
            params: { placement_id: placementId.value, month: month.value, year: year.value },
        });
        dtr.value = data;
    } catch (e) {
        errorMsg.value = e?.response?.data?.message ?? 'Failed to generate DTR. Please try again.';
    } finally {
        loading.value = false;
    }
};

const print = () => window.print();
</script>

<template>
    <Head title="📋 DTR Generator" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                <i class="fa-regular fa-file-lines text-base text-slate-400"></i>
                DTR Generator
            </h2>
        </template>

        <!-- Controls — hidden on print -->
        <div class="no-print space-y-4">
            <div class="card card-body">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Generate Daily Time Record</p>
                <p class="mt-1 text-sm text-slate-500">
                    Produces <strong class="font-semibold text-slate-700">CS Form No. 48</strong> — the standard
                    Civil Service Commission Daily Time Record. Includes approved and pending attendance logs.
                </p>

                <div class="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">Placement</label>
                        <select v-model="placementId" class="mt-1.5 block w-full rounded-xl border-slate-200 bg-white/90 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                            <option value="">Select placement</option>
                            <option v-for="p in props.placements" :key="p.id" :value="p.id">
                                {{ p.student?.user?.name }} — {{ p.company?.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">Month</label>
                        <select v-model="month" class="mt-1.5 block w-full rounded-xl border-slate-200 bg-white/90 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                            <option v-for="(name, i) in MONTHS" :key="i+1" :value="i+1">{{ name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">Year</label>
                        <select v-model="year" class="mt-1.5 block w-full rounded-xl border-slate-200 bg-white/90 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                        </select>
                    </div>
                </div>

                <div class="mt-5 flex items-center gap-3">
                    <button
                        type="button"
                        :disabled="!placementId || loading"
                        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
                        @click="generate"
                    >
                        <i class="fa-solid fa-file-circle-plus text-xs"></i>
                        {{ loading ? 'Generating…' : 'Generate DTR' }}
                    </button>
                    <button
                        v-if="dtr"
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        @click="print"
                    >
                        <i class="fa-solid fa-print text-xs"></i>
                        Print / Save as PDF
                    </button>
                </div>
                <p v-if="errorMsg" class="mt-3 flex items-center gap-2 text-sm text-rose-600">
                    <i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg }}
                </p>
            </div>

            <div v-if="!dtr && !loading" class="empty-state py-16">
                <div class="empty-state-icon">
                    <i class="fa-regular fa-file-lines text-xl"></i>
                </div>
                <p class="text-sm font-medium text-slate-500">No DTR generated yet</p>
                <p class="text-xs text-slate-400">Select a placement and month above, then click Generate DTR</p>
            </div>
        </div>

        <!-- ── CS Form No. 48 Preview ── -->
        <div v-if="dtr" id="dtr-print-area" class="mt-6">
            <div class="dtr-form">

                <!-- Form number top-left -->
                <p class="dtr-formno-topleft">Civil Service Form No. 48</p>

                <!-- Title block -->
                <div class="dtr-header">
                    <h1 class="dtr-title">DAILY TIME RECORD</h1>
                    <p class="dtr-ooо">-oOo-</p>
                </div>

                <!-- Name field (centered, underlined) -->
                <div class="dtr-name-row">
                    <div class="dtr-name-field">{{ dtr.student_name }}</div>
                    <p class="dtr-name-label">(Name)</p>
                </div>

                <!-- Month / Official hours row -->
                <div class="dtr-month-row">
                    <div class="dtr-month-left">
                        <span>For the month of&nbsp;</span>
                        <span class="dtr-underline-val">{{ monthName }}, {{ dtr.year }}</span>
                    </div>
                    <div class="dtr-month-right">
                        <div class="dtr-hours-label">Official hours for<br>arrival and departure</div>
                        <div class="dtr-hours-fields">
                            <div>Regular days <span class="dtr-short-line"></span></div>
                            <div>Saturdays <span class="dtr-short-line"></span></div>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <table class="dtr-table">
                    <thead>
                        <tr>
                            <th rowspan="2" class="dtr-th dtr-col-day">Day</th>
                            <th colspan="2" class="dtr-th">A.M.</th>
                            <th colspan="2" class="dtr-th">P.M.</th>
                            <th colspan="2" class="dtr-th">Undertime</th>
                        </tr>
                        <tr>
                            <th class="dtr-th dtr-col-time">Arrival</th>
                            <th class="dtr-th dtr-col-time">Depar-<br>ture</th>
                            <th class="dtr-th dtr-col-time">Arrival</th>
                            <th class="dtr-th dtr-col-time">Depar-<br>ture</th>
                            <th class="dtr-th dtr-col-under">Hours</th>
                            <th class="dtr-th dtr-col-under">Min-<br>utes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="day in processedDays"
                            :key="day.day"
                            :class="day.time_in ? 'dtr-row-active' : ''"
                        >
                            <td class="dtr-td dtr-td-day">{{ day.day }}</td>
                            <td class="dtr-td dtr-td-time">{{ fmt(day.amArrival) }}</td>
                            <td class="dtr-td dtr-td-time">{{ fmt(day.amDeparture) }}</td>
                            <td class="dtr-td dtr-td-time">{{ fmt(day.pmArrival) }}</td>
                            <td class="dtr-td dtr-td-time">{{ fmt(day.pmDeparture) }}</td>
                            <td class="dtr-td"></td>
                            <td class="dtr-td"></td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" class="dtr-td dtr-td-total">Total</td>
                            <td class="dtr-td"></td>
                            <td class="dtr-td"></td>
                        </tr>
                    </tfoot>
                </table>

                <!-- Certification -->
                <div class="dtr-cert">
                    <p class="dtr-cert-text">
                        I certify on my honor that the above is a true and correct report of
                        the hours of work performed, record of which was made daily at the
                        time of arrival and departure from office.
                    </p>
                    <div class="dtr-sig-center">
                        <div class="dtr-sig-line-wide"></div>
                    </div>
                    <div class="dtr-verified-block">
                        <p class="dtr-verified-lbl">VERIFIED as to the prescribed office hours:</p>
                        <div class="dtr-sig-line-wide" style="margin-top:40px;"></div>
                        <p class="dtr-in-charge">(In Charge)</p>
                    </div>
                </div>

            </div>
        </div>
    </AuthenticatedLayout>
</template>

<style scoped>
/* ── DTR Form ─────────────────────────────────────────────── */
.dtr-form {
    max-width: 560px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 28px 36px 40px;
    font-family: 'Times New Roman', Times, serif;
    font-size: 12px;
    color: #0f172a;
    box-shadow: 0 1px 6px rgba(0,0,0,.07);
}

/* Form number — top left */
.dtr-formno-topleft {
    font-size: 9.5px;
    font-style: italic;
    color: #334155;
    margin-bottom: 4px;
}

/* Title block */
.dtr-header { text-align: center; margin-bottom: 6px; }
.dtr-title  {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
    margin: 0 0 2px;
}
.dtr-ooо { font-size: 11px; margin: 0 0 10px; }

/* Name field — centered with underline */
.dtr-name-row    { text-align: center; margin-bottom: 4px; }
.dtr-name-field  {
    display: inline-block;
    min-width: 300px;
    border-bottom: 1px solid #0f172a;
    font-weight: 600;
    font-size: 13px;
    padding-bottom: 1px;
    min-height: 18px;
}
.dtr-name-label  { font-size: 9.5px; font-style: italic; color: #475569; margin-top: 2px; }

/* Month / hours row */
.dtr-month-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 11px;
    border-top: 1.5px solid #0f172a;
    border-bottom: 1.5px solid #0f172a;
    padding: 6px 2px;
    margin-bottom: 0;
    gap: 12px;
}
.dtr-month-left { display: flex; align-items: baseline; gap: 2px; }
.dtr-underline-val {
    display: inline-block;
    min-width: 140px;
    border-bottom: 1px solid #0f172a;
    font-weight: 600;
    font-size: 11px;
    padding-bottom: 1px;
}
.dtr-month-right {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 10px;
    font-style: italic;
    text-align: right;
}
.dtr-hours-label { line-height: 1.5; }
.dtr-hours-fields { display: flex; flex-direction: column; gap: 2px; font-style: normal; }
.dtr-short-line {
    display: inline-block;
    width: 64px;
    border-bottom: 1px solid #0f172a;
    vertical-align: middle;
    margin-left: 3px;
}

/* Table */
.dtr-table { width: 100%; border-collapse: collapse; }

.dtr-th {
    border: 1px solid #0f172a;
    text-align: center;
    padding: 3px 2px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    background: #f1f5f9;
    line-height: 1.3;
}
.dtr-col-day   { width: 30px; }
.dtr-col-time  { width: 76px; }
.dtr-col-under { width: 50px; }

.dtr-td {
    border: 1px solid #64748b;
    text-align: center;
    height: 17px;
    padding: 1px 2px;
    font-size: 10.5px;
}
.dtr-td-day  { font-weight: 700; border-color: #0f172a; }
.dtr-td-time { font-family: 'Courier New', monospace; letter-spacing: .01em; }
.dtr-td-total {
    text-align: right;
    padding-right: 10px;
    font-weight: 700;
    font-size: 9.5px;
    letter-spacing: .04em;
    border: 1px solid #0f172a;
}

.dtr-row-active td { background: #f0fdf4; }

/* Certification / footer */
.dtr-cert       { margin-top: 16px; font-size: 10.5px; }
.dtr-cert-text  { font-style: italic; line-height: 1.7; }

.dtr-sig-center     { display: flex; justify-content: center; margin-top: 36px; }
.dtr-sig-line-wide  { border-bottom: 1px solid #0f172a; width: 100%; }

.dtr-verified-block { margin-top: 24px; }
.dtr-verified-lbl   { font-size: 10px; font-style: italic; }
.dtr-in-charge      {
    text-align: center;
    font-size: 10px;
    letter-spacing: .06em;
    margin-top: 4px;
    font-style: italic;
}

/* ── Print ─────────────────────────────────────────────────── */
@media print {
    .no-print { display: none !important; }

    #dtr-print-area { margin: 0 !important; }

    .dtr-form {
        max-width: 100%;
        border: none;
        border-radius: 0;
        box-shadow: none;
        padding: 0;
    }

    .dtr-row-active td { background: #ffffff !important; }

    @page {
        size: Letter portrait;
        margin: 12mm 18mm;
    }
}
</style>
