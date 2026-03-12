<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\AttendanceLog;
use App\Models\Placement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class DtrController extends Controller
{
    public function index(): Response
    {
        $placements = $this->resolvePlacements(request()->user());

        return Inertia::render('Dtr/Index', [
            'placements' => $placements,
        ]);
    }

    public function generate(): JsonResponse
    {
        $placementId = request()->integer('placement_id');
        $month       = request()->integer('month');
        $year        = request()->integer('year');

        abort_if(! $placementId || ! $month || ! $year, 422, 'Missing required parameters.');

        $user  = request()->user();
        $scope = $this->resolvePlacementIds($user);

        if ($scope !== null && ! in_array($placementId, $scope, true)) {
            abort(403, 'You do not have access to this placement.');
        }

        $placement = Placement::with(['student.user', 'company'])->findOrFail($placementId);

        $startDate   = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate     = $startDate->copy()->endOfMonth();
        $daysInMonth = $startDate->daysInMonth;

        $logs = AttendanceLog::where('placement_id', $placementId)
            ->whereBetween('work_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['approved', 'pending'])
            ->get()
            ->keyBy(fn ($log) => $log->work_date->day);

        $days = [];

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $log = $logs->get($day);

            $days[] = [
                'day'           => $day,
                'time_in'       => $log?->time_in?->toIso8601String(),
                'time_out'      => $log?->time_out?->toIso8601String(),
                'total_minutes' => $log?->total_minutes ?? 0,
                'status'        => $log?->status,
            ];
        }

        return response()->json([
            'student_name' => $placement->student?->user?->name ?? '—',
            'company_name' => $placement->company?->name ?? '—',
            'month'        => $month,
            'year'         => $year,
            'days'         => $days,
        ]);
    }

    private function resolvePlacements(User $user): array
    {
        $query = Placement::query()
            ->with(['student.user', 'company'])
            ->whereIn('status', ['approved', 'active', 'completed']);

        $role = $user->role?->value ?? (string) $user->role;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return $query->get()->toArray();
        }

        if ($role === UserRole::Adviser->value && $user->adviserProfile) {
            return $query->where('adviser_id', $user->adviserProfile->id)->get()->toArray();
        }

        if ($role === UserRole::Supervisor->value && $user->supervisorProfile) {
            return $query->where('supervisor_id', $user->supervisorProfile->id)->get()->toArray();
        }

        if ($role === UserRole::Student->value && $user->studentProfile) {
            return $query->where('student_id', $user->studentProfile->id)->get()->toArray();
        }

        return [];
    }

    private function resolvePlacementIds(User $user): ?array
    {
        $role = $user->role?->value ?? (string) $user->role;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return null; // no restriction
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
