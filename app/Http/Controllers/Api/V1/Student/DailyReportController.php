<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Requests\StoreDailyReportRequest;
use App\Http\Resources\Api\V1\DailyReportResource;
use App\Models\DailyReport;
use App\Services\DailyReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailyReportController extends StudentApiController
{
    public function __construct(private readonly DailyReportService $dailyReportService)
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
        $allowedSorts = ['work_date', 'hours_rendered', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'work_date';
        $sortDirection = $this->direction($request);

        $dailyReports = DailyReport::query()
            ->with([
                'placement:id,student_id,company_id,status,start_date,end_date',
                'placement.company:id,name',
                'reviewer:id,name',
            ])
            ->whereHas('placement', fn ($query) => $query->where('student_id', $student->id))
            ->when($placementId !== null, fn ($query) => $query->where('placement_id', $placementId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('work_date', 'like', "%{$search}%")
                        ->orWhere('accomplishments', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('reviewer_comment', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($this->perPage($request))
            ->withQueryString();

        return $this->paginatedResponse($dailyReports, DailyReportResource::class);
    }

    public function store(StoreDailyReportRequest $request): JsonResponse
    {
        $user = $this->studentUser($request);
        $student = $user->studentProfile;
        $placement = $this->ownedPlacement($student, (int) $request->integer('placement_id'));
        $this->authorize('submitDailyReport', $placement);

        $dailyReport = $this->dailyReportService->create($request->validated(), $user);
        $dailyReport->loadMissing(['placement.company:id,name', 'reviewer:id,name']);

        return response()->json([
            'message' => 'Daily report submitted successfully.',
            'data' => new DailyReportResource($dailyReport),
        ], 201);
    }
}
