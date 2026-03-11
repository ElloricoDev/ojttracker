<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Evaluation;
use App\Models\User;
use App\Repositories\Contracts\EvaluationRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EvaluationService
{
    public function __construct(
        private readonly EvaluationRepositoryInterface $evaluationRepository,
        private readonly AuditLogService $auditLogService,
    )
    {
    }

    public function create(array $payload, ?User $user): Evaluation
    {
        return DB::transaction(function () use ($payload, $user) {
            $criteria = $payload['criteria_json'] ?? null;

            if (is_string($criteria)) {
                $criteria = json_decode($criteria, true);
            }

            $role = $user?->role?->value ?? (string) $user?->role;
            $evaluatorType = $role;

            if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
                $evaluatorType = $payload['evaluator_type'] ?? $role;
            }

            if (! in_array($evaluatorType, [
                UserRole::Adviser->value,
                UserRole::Supervisor->value,
                UserRole::Admin->value,
                UserRole::Coordinator->value,
            ], true)) {
                $evaluatorType = $role;
            }

            $evaluation = $this->evaluationRepository->create([
                'placement_id' => $payload['placement_id'],
                'evaluator_type' => $evaluatorType,
                'evaluation_period' => $payload['evaluation_period'] ?? 'periodic',
                'evaluator_id' => $user?->id,
                'criteria_json' => $criteria,
                'overall_score' => $payload['overall_score'] ?? null,
                'remarks' => $payload['remarks'] ?? null,
                'evaluated_at' => isset($payload['evaluated_at'])
                    ? Carbon::parse($payload['evaluated_at'])
                    : now(),
            ]);

            if ($user) {
                $this->auditLogService->log(
                    $user,
                    'evaluation.created',
                    Evaluation::class,
                    $evaluation->id,
                    ['evaluator_type' => $evaluation->evaluator_type]
                );
            }

            return $evaluation;
        });
    }

    public function update(Evaluation $evaluation, array $payload): Evaluation
    {
        return DB::transaction(function () use ($evaluation, $payload) {
            $criteria = $payload['criteria_json'] ?? null;

            if (is_string($criteria)) {
                $criteria = json_decode($criteria, true);
            }

            return $this->evaluationRepository->update($evaluation, [
                'evaluation_period' => $payload['evaluation_period'] ?? $evaluation->evaluation_period,
                'criteria_json' => $criteria ?? $evaluation->criteria_json,
                'overall_score' => $payload['overall_score'] ?? $evaluation->overall_score,
                'remarks' => $payload['remarks'] ?? $evaluation->remarks,
                'evaluated_at' => isset($payload['evaluated_at'])
                    ? Carbon::parse($payload['evaluated_at'])
                    : $evaluation->evaluated_at ?? now(),
            ]);
        });
    }

    public function delete(Evaluation $evaluation, ?User $actor = null): void
    {
        if ($actor) {
            $this->auditLogService->log(
                $actor,
                'evaluation.deleted',
                Evaluation::class,
                $evaluation->id,
                ['evaluator_type' => $evaluation->evaluator_type]
            );
        }

        $this->evaluationRepository->delete($evaluation);
    }
}
