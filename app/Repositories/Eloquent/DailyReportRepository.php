<?php

namespace App\Repositories\Eloquent;

use App\Models\DailyReport;
use App\Repositories\Contracts\DailyReportRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DailyReportRepository implements DailyReportRepositoryInterface
{
    private function applyDailyReportFilters($query, string $search, string $sort, string $direction)
    {
        $allowedSorts = ['work_date', 'hours_rendered', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'work_date';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return $query
            ->when($search, function ($nestedQuery) use ($search) {
                $nestedQuery->where(function ($nested) use ($search) {
                    $nested->where('work_date', 'like', "%{$search}%")
                        ->orWhere('accomplishments', 'like', "%{$search}%")
                        ->orWhere('reviewer_comment', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection);
    }

    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'work_date', string $direction = 'desc'): LengthAwarePaginator
    {
        $query = DailyReport::query()
            ->with(['reviewer:id,name'])
            ->where('placement_id', $placementId)
            ;

        return $this->applyDailyReportFilters($query, $search, $sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function paginateForPlacements(?array $placementIds, int $perPage = 15, string $search = '', string $sort = 'work_date', string $direction = 'desc'): LengthAwarePaginator
    {
        $query = DailyReport::query()
            ->with(['reviewer:id,name'])
            ->when($placementIds !== null, fn ($builder) => $builder->whereIn('placement_id', $placementIds));

        return $this->applyDailyReportFilters($query, $search, $sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): DailyReport
    {
        return DailyReport::create($attributes);
    }

    public function update(DailyReport $dailyReport, array $attributes): DailyReport
    {
        $dailyReport->update($attributes);

        return $dailyReport->refresh();
    }

    public function delete(DailyReport $dailyReport): void
    {
        $dailyReport->delete();
    }
}
