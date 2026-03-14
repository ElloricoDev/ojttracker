<?php

namespace App\Repositories\Eloquent;

use App\Models\WeeklyReport;
use App\Repositories\Contracts\WeeklyReportRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WeeklyReportRepository implements WeeklyReportRepositoryInterface
{
    private function applyWeeklyReportFilters($query, string $search, string $sort, string $direction)
    {
        $allowedSorts = ['week_start', 'week_end', 'hours_rendered', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'week_start';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return $query
            ->when($search, function ($nestedQuery) use ($search) {
                $nestedQuery->where(function ($nested) use ($search) {
                    $nested->where('week_start', 'like', "%{$search}%")
                        ->orWhere('week_end', 'like', "%{$search}%")
                        ->orWhere('accomplishments', 'like', "%{$search}%")
                        ->orWhere('reviewer_comment', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection);
    }

    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'week_start', string $direction = 'desc'): LengthAwarePaginator
    {
        $query = WeeklyReport::query()
            ->with(['reviewer:id,name'])
            ->where('placement_id', $placementId)
            ;

        return $this->applyWeeklyReportFilters($query, $search, $sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function paginateForPlacements(?array $placementIds, int $perPage = 15, string $search = '', string $sort = 'week_start', string $direction = 'desc'): LengthAwarePaginator
    {
        $query = WeeklyReport::query()
            ->with(['reviewer:id,name'])
            ->when($placementIds !== null, fn ($builder) => $builder->whereIn('placement_id', $placementIds));

        return $this->applyWeeklyReportFilters($query, $search, $sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): WeeklyReport
    {
        return WeeklyReport::create($attributes);
    }

    public function update(WeeklyReport $weeklyReport, array $attributes): WeeklyReport
    {
        $weeklyReport->update($attributes);

        return $weeklyReport->refresh();
    }

    public function delete(WeeklyReport $weeklyReport): void
    {
        $weeklyReport->delete();
    }
}
