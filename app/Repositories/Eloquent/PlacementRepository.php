<?php

namespace App\Repositories\Eloquent;

use App\Models\Placement;
use App\Repositories\Contracts\PlacementRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PlacementRepository implements PlacementRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 15, string $sort = 'created_at', string $direction = 'desc', ?array $placementIds = null): LengthAwarePaginator
    {
        $allowedSorts = ['created_at', 'start_date', 'end_date', 'status', 'required_hours'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return Placement::query()
            ->with(['student.user', 'company', 'supervisor.user', 'adviser.user', 'batch'])
            ->when($placementIds !== null, fn ($query) => $query->whereIn('id', $placementIds))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery->whereHas('student.user', function ($studentQuery) use ($search) {
                        $studentQuery->where('name', 'like', "%{$search}%");
                    })->orWhereHas('company', function ($companyQuery) use ($search) {
                        $companyQuery->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): Placement
    {
        return Placement::create($attributes);
    }

    public function update(Placement $placement, array $attributes): Placement
    {
        $placement->update($attributes);

        return $placement->refresh();
    }

    public function delete(Placement $placement): void
    {
        $placement->delete();
    }
}
