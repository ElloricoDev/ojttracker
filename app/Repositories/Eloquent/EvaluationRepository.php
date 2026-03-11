<?php

namespace App\Repositories\Eloquent;

use App\Models\Evaluation;
use App\Repositories\Contracts\EvaluationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EvaluationRepository implements EvaluationRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'evaluated_at', string $direction = 'desc'): LengthAwarePaginator
    {
        $allowedSorts = ['evaluated_at', 'overall_score', 'evaluation_period', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'evaluated_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return Evaluation::query()
            ->with(['evaluator:id,name'])
            ->where('placement_id', $placementId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->whereHas('evaluator', function ($evaluatorQuery) use ($search) {
                        $evaluatorQuery->where('name', 'like', "%{$search}%");
                    })->orWhere('remarks', 'like', "%{$search}%")
                        ->orWhere('evaluation_period', 'like', "%{$search}%")
                        ->orWhere('evaluated_at', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): Evaluation
    {
        return Evaluation::create($attributes);
    }

    public function update(Evaluation $evaluation, array $attributes): Evaluation
    {
        $evaluation->update($attributes);

        return $evaluation->refresh();
    }

    public function delete(Evaluation $evaluation): void
    {
        $evaluation->delete();
    }
}
