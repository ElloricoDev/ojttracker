<?php

namespace App\Repositories\Contracts;

use App\Models\DailyReport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DailyReportRepositoryInterface
{
    public function paginateForPlacement(int $placementId, int $perPage = 15, string $search = '', string $sort = 'work_date', string $direction = 'desc'): LengthAwarePaginator;

    public function create(array $attributes): DailyReport;

    public function update(DailyReport $dailyReport, array $attributes): DailyReport;

    public function delete(DailyReport $dailyReport): void;
}
