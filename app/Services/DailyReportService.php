<?php

namespace App\Services;

use App\Models\DailyReport;
use App\Models\User;
use App\Models\Placement;
use App\Repositories\Contracts\DailyReportRepositoryInterface;
use Illuminate\Support\Facades\DB;

class DailyReportService
{
    public function __construct(
        private readonly DailyReportRepositoryInterface $dailyReportRepository,
        private readonly AuditLogService $auditLogService,
        private readonly NotificationService $notificationService,
    )
    {
    }

    public function create(array $attributes, ?User $actor = null): DailyReport
    {
        return DB::transaction(function () use ($attributes, $actor) {
            $report = $this->dailyReportRepository->create($attributes);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'daily_report.submitted',
                    DailyReport::class,
                    $report->id,
                    ['placement_id' => $report->placement_id]
                );
            }

            $placement = Placement::find($report->placement_id);
            if ($placement) {
                $this->notificationService->notifyPlacementReviewers(
                    $placement,
                    'daily_report.pending',
                    'Daily report pending review',
                    'A daily report was submitted and requires review.',
                    route('daily-reports.index', ['placement_id' => $report->placement_id]),
                    ['daily_report_id' => $report->id]
                );
            }

            return $report;
        });
    }

    public function update(DailyReport $dailyReport, array $attributes, ?User $actor = null): DailyReport
    {
        return DB::transaction(function () use ($dailyReport, $attributes, $actor) {
            $updated = $this->dailyReportRepository->update($dailyReport, [
                'status' => $attributes['status'],
                'reviewer_comment' => $attributes['reviewer_comment'] ?? null,
                'reviewer_id' => $attributes['reviewer_id'] ?? null,
            ]);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'daily_report.reviewed',
                    DailyReport::class,
                    $updated->id,
                    ['status' => $updated->status]
                );
            }

            $placement = Placement::find($updated->placement_id);
            if ($placement) {
                $statusTitle = $updated->status === 'reviewed' ? 'Daily report approved' : 'Daily report rejected';
                $this->notificationService->notifyStudent(
                    $placement,
                    'daily_report.reviewed',
                    $statusTitle,
                    'Your daily report was reviewed.',
                    route('daily-reports.index', ['placement_id' => $updated->placement_id]),
                    ['daily_report_id' => $updated->id, 'status' => $updated->status]
                );
            }

            return $updated;
        });
    }

    public function delete(DailyReport $dailyReport): void
    {
        DB::transaction(fn () => $this->dailyReportRepository->delete($dailyReport));
    }
}
