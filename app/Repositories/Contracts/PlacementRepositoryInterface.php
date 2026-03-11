<?php

namespace App\Repositories\Contracts;

use App\Models\Placement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PlacementRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 15, string $sort = 'created_at', string $direction = 'desc', ?array $placementIds = null): LengthAwarePaginator;

    public function create(array $attributes): Placement;

    public function update(Placement $placement, array $attributes): Placement;

    public function delete(Placement $placement): void;
}
