<?php

namespace App\Services;

use App\Models\Placement;
use App\Models\User;
use App\Models\WeeklyReport;
use App\Repositories\Contracts\WeeklyReportRepositoryInterface;
use Illuminate\Support\Facades\DB;

class WeeklyReportService
{
    public function __construct(
        private readonly WeeklyReportRepositoryInterface $weeklyReportRepository,
        private readonly AuditLogService $auditLogService,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(array $attributes, ?User $actor = null): WeeklyReport
    {
        return DB::transaction(function () use ($attributes, $actor) {
            $report = $this->weeklyReportRepository->create($attributes);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'weekly_report.submitted',
                    WeeklyReport::class,
                    $report->id,
                    ['placement_id' => $report->placement_id]
                );
            }

            $placement = Placement::find($report->placement_id);
            if ($placement) {
                $this->notificationService->notifyPlacementReviewers(
                    $placement,
                    'weekly_report.pending',
                    'Weekly report pending review',
                    'A weekly report was submitted and requires review.',
                    route('weekly-reports.index', ['placement_id' => $report->placement_id]),
                    ['weekly_report_id' => $report->id]
                );
            }

            return $report;
        });
    }

    public function update(WeeklyReport $weeklyReport, array $attributes, ?User $actor = null): WeeklyReport
    {
        return DB::transaction(function () use ($weeklyReport, $attributes, $actor) {
            $updated = $this->weeklyReportRepository->update($weeklyReport, [
                'status' => $attributes['status'],
                'reviewer_comment' => $attributes['reviewer_comment'] ?? null,
                'reviewer_id' => $attributes['reviewer_id'] ?? null,
            ]);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'weekly_report.reviewed',
                    WeeklyReport::class,
                    $updated->id,
                    ['status' => $updated->status]
                );
            }

            $placement = Placement::find($updated->placement_id);
            if ($placement) {
                $statusTitle = $updated->status === 'reviewed' ? 'Weekly report approved' : 'Weekly report rejected';
                $this->notificationService->notifyStudent(
                    $placement,
                    'weekly_report.reviewed',
                    $statusTitle,
                    'Your weekly report was reviewed.',
                    route('weekly-reports.index', ['placement_id' => $updated->placement_id]),
                    ['weekly_report_id' => $updated->id, 'status' => $updated->status]
                );
            }

            return $updated;
        });
    }

    public function delete(WeeklyReport $weeklyReport): void
    {
        DB::transaction(fn () => $this->weeklyReportRepository->delete($weeklyReport));
    }
}
