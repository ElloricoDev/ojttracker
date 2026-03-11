<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Jobs\SendNotificationJob;
use App\Models\AttendanceLog;
use App\Models\DailyReport;
use App\Models\Document;
use App\Models\Placement;
use App\Models\User;
use App\Models\WeeklyReport;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendOjtReminders extends Command
{
    protected $signature = 'ojt:send-reminders';
    protected $description = 'Send reminder notifications for missing logs and pending approvals.';

    public function handle(): int
    {
        $today = now()->startOfDay();
        $yesterday = $today->copy()->subDay();

        $activePlacements = Placement::query()
            ->with(['student.user', 'adviser.user', 'supervisor.user'])
            ->where('status', 'active')
            ->get();

        $this->remindMissingDailyReports($activePlacements, $yesterday);
        $this->remindMissingWeeklyReports($activePlacements, $today);
        $this->remindPendingApprovals($activePlacements);

        $this->info('Reminders dispatched.');
        return self::SUCCESS;
    }

    private function remindMissingDailyReports($placements, Carbon $workDate): void
    {
        $placementIds = $placements->pluck('id')->all();

        if ($placementIds === []) {
            return;
        }

        $submitted = DailyReport::query()
            ->whereIn('placement_id', $placementIds)
            ->whereDate('work_date', $workDate)
            ->pluck('placement_id')
            ->all();

        $missing = $placements->filter(fn ($placement) => ! in_array($placement->id, $submitted, true));

        $missing->each(function ($placement) use ($workDate) {
            $studentId = $placement->student?->user_id;
            if (! $studentId) {
                return;
            }

            SendNotificationJob::dispatch([
                $studentId,
            ], 'reminder.daily_report', 'Daily report missing', "You have not submitted a daily report for {$workDate->toDateString()}.", route('daily-reports.index', ['placement_id' => $placement->id]), [
                'placement_id' => $placement->id,
                'work_date' => $workDate->toDateString(),
            ]);
        });
    }

    private function remindMissingWeeklyReports($placements, Carbon $today): void
    {
        if (! $today->isMonday()) {
            return;
        }

        $weekStart = $today->copy()->subWeek()->startOfWeek();
        $weekEnd = $today->copy()->subWeek()->endOfWeek();

        $placementIds = $placements->pluck('id')->all();

        if ($placementIds === []) {
            return;
        }

        $submitted = WeeklyReport::query()
            ->whereIn('placement_id', $placementIds)
            ->whereDate('week_start', $weekStart)
            ->whereDate('week_end', $weekEnd)
            ->pluck('placement_id')
            ->all();

        $missing = $placements->filter(fn ($placement) => ! in_array($placement->id, $submitted, true));

        $missing->each(function ($placement) use ($weekStart, $weekEnd) {
            $studentId = $placement->student?->user_id;
            if (! $studentId) {
                return;
            }

            SendNotificationJob::dispatch([
                $studentId,
            ], 'reminder.weekly_report', 'Weekly report missing', "Please submit your weekly report ({$weekStart->toDateString()} - {$weekEnd->toDateString()}).", route('weekly-reports.index', ['placement_id' => $placement->id]), [
                'placement_id' => $placement->id,
                'week_start' => $weekStart->toDateString(),
                'week_end' => $weekEnd->toDateString(),
            ]);
        });
    }

    private function remindPendingApprovals($placements): void
    {
        $placementIds = $placements->pluck('id')->all();

        if ($placementIds === []) {
            return;
        }

        $pendingAttendance = AttendanceLog::query()
            ->whereIn('placement_id', $placementIds)
            ->where('status', 'pending')
            ->count();

        $pendingDaily = DailyReport::query()
            ->whereIn('placement_id', $placementIds)
            ->where('status', 'submitted')
            ->count();

        $pendingWeekly = WeeklyReport::query()
            ->whereIn('placement_id', $placementIds)
            ->where('status', 'submitted')
            ->count();

        $pendingDocuments = Document::query()
            ->whereIn('placement_id', $placementIds)
            ->where('status', 'pending')
            ->count();

        $summary = [
            'attendance' => $pendingAttendance,
            'daily_reports' => $pendingDaily,
            'weekly_reports' => $pendingWeekly,
            'documents' => $pendingDocuments,
        ];

        $hasPending = collect($summary)->sum() > 0;
        if (! $hasPending) {
            return;
        }

        $reviewers = User::query()
            ->whereIn('role', [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value, UserRole::Supervisor->value])
            ->get();

        foreach ($reviewers as $reviewer) {
            $scopePlacements = $placements;

            if ($reviewer->role?->value === UserRole::Adviser->value && $reviewer->adviserProfile) {
                $scopePlacements = $placements->where('adviser_id', $reviewer->adviserProfile->id);
            }

            if ($reviewer->role?->value === UserRole::Supervisor->value && $reviewer->supervisorProfile) {
                $scopePlacements = $placements->where('supervisor_id', $reviewer->supervisorProfile->id);
            }

            $scopeIds = $scopePlacements->pluck('id')->all();
            if ($scopeIds === []) {
                continue;
            }

            $counts = [
                'attendance' => AttendanceLog::query()->whereIn('placement_id', $scopeIds)->where('status', 'pending')->count(),
                'daily_reports' => DailyReport::query()->whereIn('placement_id', $scopeIds)->where('status', 'submitted')->count(),
                'weekly_reports' => WeeklyReport::query()->whereIn('placement_id', $scopeIds)->where('status', 'submitted')->count(),
                'documents' => Document::query()->whereIn('placement_id', $scopeIds)->where('status', 'pending')->count(),
            ];

            if (collect($counts)->sum() === 0) {
                continue;
            }

            $body = sprintf(
                'Pending approvals: %d attendance, %d daily reports, %d weekly reports, %d documents.',
                $counts['attendance'],
                $counts['daily_reports'],
                $counts['weekly_reports'],
                $counts['documents'],
            );

            SendNotificationJob::dispatch([
                $reviewer->id,
            ], 'reminder.pending', 'Pending approvals', $body, route('dashboard'), $counts);
        }
    }
}
