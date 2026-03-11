<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\TimeInRequest;
use App\Http\Requests\TimeOutRequest;
use App\Enums\UserRole;
use App\Models\AttendanceLog;
use App\Models\Placement;
use App\Models\User;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    use NotifiesUser;
    public function __construct(private readonly AttendanceService $attendanceService)
    {
    }

    public function index(): Response
    {
        $user = request()->user();
        $role = $user?->role?->value ?? (string) $user?->role;
        $placementScope = $this->resolvePlacementScope($user);
        $perPage = (int) request()->input('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $search = request()->string('search')->toString();
        $sort = request()->string('sort')->toString() ?: 'work_date';
        $direction = request()->string('direction')->toString() ?: 'desc';
        $allowedSorts = ['work_date', 'total_minutes', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'work_date';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $placements = Placement::query()
            ->with(['student.user', 'company'])
            ->whereIn('status', ['approved', 'active'])
            ->when($placementScope, fn ($query) => $query->whereIn('id', $placementScope))
            ->get();

        $attendanceLogs = AttendanceLog::query()
            ->with(['placement.student.user', 'approver:id,name'])
            ->when($placementScope, fn ($query) => $query->whereIn('placement_id', $placementScope))
            ->when($search, function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->whereHas('placement.student.user', function ($studentQuery) use ($search) {
                        $studentQuery->where('name', 'like', "%{$search}%");
                    })->orWhereHas('placement.company', function ($companyQuery) use ($search) {
                        $companyQuery->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Attendance/Index', [
            'placements' => $placements,
            'attendanceLogs' => $attendanceLogs,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortColumn,
                'direction' => $sortDirection,
            ],
            'canApprove' => in_array($role, [
                UserRole::Admin->value,
                UserRole::Coordinator->value,
                UserRole::Supervisor->value,
                UserRole::Adviser->value,
            ], true),
        ]);
    }

    public function timeIn(TimeInRequest $request): RedirectResponse
    {
        $timestamp = $request->filled('timestamp')
            ? Carbon::parse($request->string('timestamp'))
            : now();

        $placement = Placement::findOrFail((int) $request->integer('placement_id'));
        $this->authorize('logAttendance', $placement);

        $this->attendanceService->timeIn((int) $request->integer('placement_id'), $timestamp, $request->user());
        $this->toast($request->user()?->id, 'Time in logged', 'Your time in has been recorded.');

        return back();
    }

    public function timeOut(TimeOutRequest $request): RedirectResponse
    {
        $timestamp = $request->filled('timestamp')
            ? Carbon::parse($request->string('timestamp'))
            : now();

        $placement = Placement::findOrFail((int) $request->integer('placement_id'));
        $this->authorize('logAttendance', $placement);

        $this->attendanceService->timeOut((int) $request->integer('placement_id'), $timestamp, $request->user());
        $this->toast($request->user()?->id, 'Time out logged', 'Your time out has been recorded.');

        return back();
    }

    public function approve(AttendanceLog $attendanceLog): RedirectResponse
    {
        $attendanceLog->loadMissing('placement');
        $this->authorize('approve', $attendanceLog);

        $this->attendanceService->approve($attendanceLog, request()->user());
        $this->toast(request()->user()?->id, 'Attendance approved', 'Attendance log has been approved.');

        return back();
    }

    public function reject(AttendanceLog $attendanceLog): RedirectResponse
    {
        $attendanceLog->loadMissing('placement');
        $this->authorize('approve', $attendanceLog);

        $this->attendanceService->reject($attendanceLog, request()->user(), request()->string('remarks')->toString());
        $this->toast(request()->user()?->id, 'Attendance rejected', 'Attendance log has been rejected.');

        return back();
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

