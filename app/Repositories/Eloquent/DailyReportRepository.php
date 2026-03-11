<?php

namespace App\Repositories\Eloquent;

use App\Models\DailyReport;
use App\Repositories\Contracts\DailyReportRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DailyReportRepository implements DailyReportRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'work_date', string $direction = 'desc'): LengthAwarePaginator
    {
        $allowedSorts = ['work_date', 'hours_rendered', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'work_date';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        return DailyReport::query()
            ->with(['reviewer:id,name'])
            ->where('placement_id', $placementId)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('work_date', 'like', "%{$search}%")
                        ->orWhere('accomplishments', 'like', "%{$search}%")
                        ->orWhere('reviewer_comment', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
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
