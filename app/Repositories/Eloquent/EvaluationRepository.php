<?php

namespace App\Repositories\Eloquent;

use App\Models\Evaluation;
use App\Repositories\Contracts\EvaluationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EvaluationRepository implements EvaluationRepositoryInterface
{
    private function applyEvaluationFilters($query, string $search, string $sort, string $direction)
    {
        $allowedSorts = ['evaluated_at', 'overall_score', 'evaluation_period', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'evaluated_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return $query
            ->when($search, function ($nestedQuery) use ($search) {
                $nestedQuery->where(function ($nested) use ($search) {
                    $nested->whereHas('evaluator', function ($evaluatorQuery) use ($search) {
                        $evaluatorQuery->where('name', 'like', "%{$search}%");
                    })->orWhere('remarks', 'like', "%{$search}%")
                        ->orWhere('evaluation_period', 'like', "%{$search}%")
                        ->orWhere('evaluated_at', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection);
    }

    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'evaluated_at', string $direction = 'desc'): LengthAwarePaginator
    {
        $query = Evaluation::query()
            ->with(['evaluator:id,name'])
            ->where('placement_id', $placementId)
            ;

        return $this->applyEvaluationFilters($query, $search, $sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function paginateForPlacements(?array $placementIds, int $perPage = 15, string $search = '', string $sort = 'evaluated_at', string $direction = 'desc'): LengthAwarePaginator
    {
        $query = Evaluation::query()
            ->with(['evaluator:id,name'])
            ->when($placementIds !== null, fn ($builder) => $builder->whereIn('placement_id', $placementIds));

        return $this->applyEvaluationFilters($query, $search, $sort, $direction)
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
