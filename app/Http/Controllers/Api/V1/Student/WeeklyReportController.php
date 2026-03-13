<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Requests\StoreWeeklyReportRequest;
use App\Http\Resources\Api\V1\WeeklyReportResource;
use App\Models\WeeklyReport;
use App\Services\WeeklyReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeeklyReportController extends StudentApiController
{
    public function __construct(private readonly WeeklyReportService $weeklyReportService)
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
        $sort = $request->string('sort')->toString() ?: 'week_start';
        $allowedSorts = ['week_start', 'week_end', 'hours_rendered', 'status', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'week_start';
        $sortDirection = $this->direction($request);

        $weeklyReports = WeeklyReport::query()
            ->with([
                'placement:id,student_id,company_id,status,start_date,end_date',
                'placement.company:id,name',
                'reviewer:id,name',
            ])
            ->whereHas('placement', fn ($query) => $query->where('student_id', $student->id))
            ->when($placementId !== null, fn ($query) => $query->where('placement_id', $placementId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('week_start', 'like', "%{$search}%")
                        ->orWhere('week_end', 'like', "%{$search}%")
                        ->orWhere('accomplishments', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('reviewer_comment', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($this->perPage($request))
            ->withQueryString();

        return $this->paginatedResponse($weeklyReports, WeeklyReportResource::class);
    }

    public function store(StoreWeeklyReportRequest $request): JsonResponse
    {
        $user = $this->studentUser($request);
        $student = $user->studentProfile;
        $placement = $this->ownedPlacement($student, (int) $request->integer('placement_id'));
        $this->authorize('submitWeeklyReport', $placement);

        $weeklyReport = $this->weeklyReportService->create($request->validated(), $user);
        $weeklyReport->loadMissing(['placement.company:id,name', 'reviewer:id,name']);

        return response()->json([
            'message' => 'Weekly report submitted successfully.',
            'data' => new WeeklyReportResource($weeklyReport),
        ], 201);
    }
}
