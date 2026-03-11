<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\AttendanceLog;
use App\Models\DailyReport;
use App\Models\Document;
use App\Models\Evaluation;
use App\Models\Placement;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = request()->user();
        $role = $user?->role?->value ?? (string) $user?->role;
        $placementIds = $this->resolvePlacementScope($user);

        $metrics = [
            'totalPlacements' => Placement::when($placementIds, fn ($query) => $query->whereIn('id', $placementIds))->count(),
            'activePlacements' => Placement::when($placementIds, fn ($query) => $query->whereIn('id', $placementIds))
                ->where('status', 'active')
                ->count(),
            'pendingPlacements' => Placement::when($placementIds, fn ($query) => $query->whereIn('id', $placementIds))
                ->where('status', 'pending')
                ->count(),
            'pendingReports' => DailyReport::when($placementIds, fn ($query) => $query->whereIn('placement_id', $placementIds))
                ->where('status', 'submitted')
                ->count(),
            'hoursRendered' => round((AttendanceLog::when($placementIds, fn ($query) => $query->whereIn('placement_id', $placementIds))
                ->sum('total_minutes') / 60), 2),
        ];

        $recentPlacements = Placement::query()
            ->with(['student.user', 'company'])
            ->when($placementIds, fn ($query) => $query->whereIn('id', $placementIds))
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Placement $placement) => [
                'id' => $placement->id,
                'student' => $placement->student?->user?->name,
                'company' => $placement->company?->name,
                'status' => $placement->status,
                'start_date' => optional($placement->start_date)->toDateString(),
            ]);

        $roleInsights = [
            'pendingAttendance' => AttendanceLog::when($placementIds, fn ($query) => $query->whereIn('placement_id', $placementIds))
                ->where('status', 'pending')
                ->count(),
            'pendingReports' => DailyReport::when($placementIds, fn ($query) => $query->whereIn('placement_id', $placementIds))
                ->where('status', 'submitted')
                ->count(),
            'pendingDocuments' => Document::when($placementIds, fn ($query) => $query->whereIn('placement_id', $placementIds))
                ->where('status', 'pending')
                ->count(),
            'pendingEvaluations' => Evaluation::when($placementIds, fn ($query) => $query->whereIn('placement_id', $placementIds))
                ->whereNull('evaluated_at')
                ->count(),
        ];

        $studentPlacement = null;
        if ($role === UserRole::Student->value) {
            $currentPlacement = Placement::query()
                ->with(['company'])
                ->when($placementIds, fn ($query) => $query->whereIn('id', $placementIds))
                ->latest()
                ->first();

            if ($currentPlacement) {
                $hoursRendered = round((AttendanceLog::where('placement_id', $currentPlacement->id)->sum('total_minutes') / 60), 2);
                $requiredHours = (int) $currentPlacement->required_hours;
                $progress = $requiredHours > 0 ? round(($hoursRendered / $requiredHours) * 100, 2) : 0;

                $studentPlacement = [
                    'company' => $currentPlacement->company?->name,
                    'status' => $currentPlacement->status,
                    'start_date' => optional($currentPlacement->start_date)->toDateString(),
                    'end_date' => optional($currentPlacement->end_date)->toDateString(),
                    'required_hours' => $requiredHours,
                    'hours_rendered' => $hoursRendered,
                    'progress' => min(100, $progress),
                ];
            }
        }

        return Inertia::render('Dashboard', [
            'role' => $role,
            'metrics' => $metrics,
            'recentPlacements' => $recentPlacements,
            'roleInsights' => $roleInsights,
            'studentPlacement' => $studentPlacement,
        ]);
    }

    private function resolvePlacementScope(?User $user): ?array
    {
        if (! $user) {
            return [];
        }

        $role = $user->role?->value ?? (string) $user->role;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return null;
        }

        if ($role === UserRole::Adviser->value && $user->adviserProfile) {
            return Placement::where('adviser_id', $user->adviserProfile->id)->pluck('id')->all();
        }

        if ($role === UserRole::Supervisor->value && $user->supervisorProfile) {
            return Placement::where('supervisor_id', $user->supervisorProfile->id)->pluck('id')->all();
        }

        if ($role === UserRole::Student->value && $user->studentProfile) {
            return Placement::where('student_id', $user->studentProfile->id)->pluck('id')->all();
        }

        return [];
    }
}
