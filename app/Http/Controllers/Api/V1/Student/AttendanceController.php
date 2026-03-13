<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Requests\TimeInRequest;
use App\Http\Requests\TimeOutRequest;
use App\Http\Resources\Api\V1\AttendanceLogResource;
use App\Models\AttendanceLog;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends StudentApiController
{
    public function __construct(private readonly AttendanceService $attendanceService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $student = $this->student($request);
        $placementId = $this->placementId($request);

        if ($placementId !== null) {
            $this->ownedPlacement($student, $placementId);
        }

        $search = $request->string('search')->toString();
        $sort = $request->string('sort')->toString() ?: 'work_date';
        $allowedSorts = ['work_date', 'total_minutes', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'work_date';
        $sortDirection = $this->direction($request);

        $attendanceLogs = AttendanceLog::query()
            ->with([
                'placement:id,student_id,company_id,status,start_date,end_date',
                'placement.company:id,name',
                'approver:id,name',
            ])
            ->whereHas('placement', fn ($query) => $query->where('student_id', $student->id))
            ->when($placementId !== null, fn ($query) => $query->where('placement_id', $placementId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('work_date', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('remarks', 'like', "%{$search}%")
                        ->orWhereHas('placement.company', fn ($companyQuery) => $companyQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($this->perPage($request))
            ->withQueryString();

        return $this->paginatedResponse($attendanceLogs, AttendanceLogResource::class);
    }

    public function timeIn(TimeInRequest $request): JsonResponse
    {
        $student = $this->student($request);
        $placement = $this->ownedPlacement($student, (int) $request->integer('placement_id'));
        $this->authorize('logAttendance', $placement);

        $timestamp = $request->filled('timestamp')
            ? Carbon::parse($request->string('timestamp')->toString())
            : now();

        $attendanceLog = $this->attendanceService->timeIn($placement->id, $timestamp, $request->user());
        $attendanceLog->loadMissing(['placement.company:id,name', 'approver:id,name']);

        return response()->json([
            'message' => 'Time in logged successfully.',
            'data' => new AttendanceLogResource($attendanceLog),
        ], 201);
    }

    public function timeOut(TimeOutRequest $request): JsonResponse
    {
        $student = $this->student($request);
        $placement = $this->ownedPlacement($student, (int) $request->integer('placement_id'));
        $this->authorize('logAttendance', $placement);

        $timestamp = $request->filled('timestamp')
            ? Carbon::parse($request->string('timestamp')->toString())
            : now();

        $attendanceLog = $this->attendanceService->timeOut($placement->id, $timestamp, $request->user());
        $attendanceLog->loadMissing(['placement.company:id,name', 'approver:id,name']);

        return response()->json([
            'message' => 'Time out logged successfully.',
            'data' => new AttendanceLogResource($attendanceLog),
        ]);
    }
}
