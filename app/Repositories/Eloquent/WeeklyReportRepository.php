<?php

namespace App\Repositories\Eloquent;

use App\Models\WeeklyReport;
use App\Repositories\Contracts\WeeklyReportRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WeeklyReportRepository implements WeeklyReportRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'week_start', string $direction = 'desc'): LengthAwarePaginator
    {
        $allowedSorts = ['week_start', 'week_end', 'hours_rendered', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'week_start';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return WeeklyReport::query()
            ->with(['reviewer:id,name'])
            ->where('placement_id', $placementId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('week_start', 'like', "%{$search}%")
                        ->orWhere('week_end', 'like', "%{$search}%")
                        ->orWhere('accomplishments', 'like', "%{$search}%")
                        ->orWhere('reviewer_comment', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
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
