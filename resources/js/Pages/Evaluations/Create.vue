<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import ConfirmDialog from '@/Components/ConfirmDialog.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import { computed, ref, watch } from 'vue';
import { Head, router, useForm, usePage } from '@inertiajs/vue3';

const props = defineProps({
    placements: Array,
    selectedPlacementId: Number,
});

const page = usePage();
const role = page.props.auth?.user?.role;
const canEdit = ['admin', 'coordinator', 'adviser', 'supervisor'].includes(role);
const canSelectType = ['admin', 'coordinator'].includes(role);

const evaluationPeriod = ref('midterm');
const criteriaTemplates = {
    adviser: [
        { key: 'technical_skill', label: 'Technical Skill' },
        { key: 'work_ethic', label: 'Work Ethic' },
        { key: 'communication', label: 'Communication' },
        { key: 'initiative', label: 'Initiative' },
        { key: 'documentation', label: 'Documentation' },
    ],
    supervisor: [
        { key: 'attendance', label: 'Attendance' },
        { key: 'quality_of_work', label: 'Quality of Work' },
        { key: 'teamwork', label: 'Teamwork' },
        { key: 'adaptability', label: 'Adaptability' },
        { key: 'productivity', label: 'Productivity' },
    ],
};

const evaluatorType = ref(canSelectType ? 'supervisor' : (role || 'supervisor'));
const criteriaScores = ref({});

const resetCriteria = () => {
    const template = criteriaTemplates[evaluatorType.value] || [];
    const scores = {};
    template.forEach((item) => {
        scores[item.key] = '';
    });
    criteriaScores.value = scores;
};

watch(evaluatorType, () => resetCriteria(), { immediate: true });

const overallScore = computed(() => {
    const values = Object.values(criteriaScores.value)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));

    if (values.length === 0) {
        return '';
    }

    const total = values.reduce((sum, value) => sum + value, 0);

    return (total / values.length).toFixed(2);
});

const initialFormData = {
    placement_id: props.selectedPlacementId || '',
    remarks: '',
    evaluated_at: '',
    evaluator_type: evaluatorType.value,
    evaluation_period: evaluationPeriod.value,
    criteria_json: {},
    overall_score: '',
};

const form = useForm({ ...initialFormData });

const submit = () => {
    form.evaluator_type = evaluatorType.value;
    form.evaluation_period = evaluationPeriod.value;
    form.post(route('evaluations.store'), {
        preserveScroll: true,
        onBefore: () => {
            form.criteria_json = Object.fromEntries(
                Object.entries(criteriaScores.value).filter(([, value]) => value !== '' && value !== null)
            );
            form.overall_score = overallScore.value ? Number(overallScore.value) : null;
            form.remarks = form.remarks || null;
            form.evaluated_at = form.evaluated_at || null;
        },
    });
};

const showBackConfirm = ref(false);

const normalizeFormData = (data) => ({
    ...data,
    placement_id: String(data.placement_id ?? ''),
    evaluation_period: String(data.evaluation_period ?? ''),
});

const hasChanges = computed(() =>
    JSON.stringify(normalizeFormData(form.data())) !== JSON.stringify(normalizeFormData(initialFormData)),
);

const goBack = () => {
    router.get(route('evaluations.index'), {
        placement_id: form.placement_id || undefined,
    });
};

const requestBack = () => {
    if (hasChanges.value) {
        showBackConfirm.value = true;
        return;
    }
    goBack();
};

const confirmBack = () => {
    showBackConfirm.value = false;
    goBack();
};

const closeBack = () => {
    showBackConfirm.value = false;
};
</script>

<template>
    <Head title="⭐ Create Evaluation" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex items-center justify-between">
                <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900" @click="requestBack">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    Back
                </button>
                <h2 class="flex items-center gap-2 text-xl font-semibold leading-tight text-slate-900">
                    <i class="fa-regular fa-star text-base text-slate-400"></i>
                    Create Evaluation
                </h2>
            </div>
        </template>

        <div class="card card-body">
            <div class="grid gap-4 md:grid-cols-4">
                <div class="md:col-span-2">
                    <InputLabel for="placement" value="Placement" />
                    <select id="placement" v-model="form.placement_id" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="">Select placement</option>
                        <option v-for="placement in props.placements" :key="placement.id" :value="placement.id">
                            {{ placement.student?.user?.name }} - {{ placement.company?.name }}
                        </option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.placement_id" />
                </div>
                <div v-if="canSelectType">
                    <InputLabel for="evaluator_type" value="Evaluator Type" />
                    <select id="evaluator_type" v-model="evaluatorType" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="supervisor">Supervisor</option>
                        <option value="adviser">Adviser</option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.evaluator_type" />
                </div>
                <div>
                    <InputLabel for="evaluation_period" value="Evaluation Period" />
                    <select id="evaluation_period" v-model="evaluationPeriod" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400">
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="periodic">Periodic</option>
                    </select>
                    <InputError class="mt-2" :message="form.errors.evaluation_period" />
                </div>
                <div>
                    <InputLabel for="overall_score" value="Overall Score" />
                    <input id="overall_score" :value="overallScore" type="text" readonly class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-100/60 px-3 py-2 text-sm text-slate-700 shadow-sm" />
                    <InputError class="mt-2" :message="form.errors.overall_score" />
                </div>
                <div>
                    <InputLabel for="evaluated_at" value="Evaluated At" />
                    <input id="evaluated_at" v-model="form.evaluated_at" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    <InputError class="mt-2" :message="form.errors.evaluated_at" />
                </div>
            </div>

            <div class="mt-4">
                <InputLabel value="Criteria Scores (0-100)" />
                <div class="mt-2 grid gap-3 md:grid-cols-2">
                    <div v-for="item in (criteriaTemplates[evaluatorType] || [])" :key="item.key">
                        <label class="text-sm font-medium text-slate-700">{{ item.label }}</label>
                        <input v-model="criteriaScores[item.key]" type="number" min="0" max="100" step="1" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" />
                    </div>
                </div>
                <InputError class="mt-2" :message="form.errors.criteria_json" />
            </div>

            <div class="mt-4">
                <InputLabel for="remarks" value="Remarks" />
                <textarea id="remarks" v-model="form.remarks" class="mt-2 block w-full rounded-xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:ring-emerald-400" rows="3" />
                <InputError class="mt-2" :message="form.errors.remarks" />
            </div>

            <div class="mt-4">
                <PrimaryButton :disabled="form.processing || !canEdit" @click="submit">
                    <i class="fa-regular fa-paper-plane mr-2 text-xs"></i>
                    Submit Evaluation
                </PrimaryButton>
            </div>
        </div>
    </AuthenticatedLayout>

    <ConfirmDialog
        :show="showBackConfirm"
        title="Discard evaluation?"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirm-label="Discard"
        cancel-label="Stay"
        tone="warning"
        @confirm="confirmBack"
        @close="closeBack"
    />
</template>
