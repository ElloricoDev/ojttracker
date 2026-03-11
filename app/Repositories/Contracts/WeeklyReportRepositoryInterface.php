<?php

namespace App\Repositories\Contracts;

use App\Models\WeeklyReport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface WeeklyReportRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'week_start', string $direction = 'desc'): LengthAwarePaginator;

    public function create(array $attributes): WeeklyReport;

    public function update(WeeklyReport $weeklyReport, array $attributes): WeeklyReport;

    public function delete(WeeklyReport $weeklyReport): void;
}
