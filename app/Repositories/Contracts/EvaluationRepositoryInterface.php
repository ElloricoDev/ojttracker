<?php

namespace App\Repositories\Contracts;

use App\Models\Evaluation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface EvaluationRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'evaluated_at', string $direction = 'desc'): LengthAwarePaginator;

    public function create(array $attributes): Evaluation;

    public function update(Evaluation $evaluation, array $attributes): Evaluation;

    public function delete(Evaluation $evaluation): void;
}
