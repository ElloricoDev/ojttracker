<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Requests\StorePlacementRequestForStudent;
use App\Http\Resources\Api\V1\PlacementResource;
use App\Models\Placement;
use App\Services\PlacementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PlacementController extends StudentApiController
{
    public function __construct(private readonly PlacementService $placementService)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $student = $this->student($request);

        $placement = Placement::query()
            ->with([
                'company:id,name,address,contact_person,email,phone',
                'supervisor.user:id,name,email',
                'adviser.user:id,name,email',
                'batch:id,name,school_year,semester,start_date,end_date',
            ])
            ->where('student_id', $student->id)
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'approved' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END")
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->first();

        return response()->json([
            'data' => $placement ? new PlacementResource($placement) : null,
        ]);
    }

    public function storeRequest(StorePlacementRequestForStudent $request): JsonResponse
    {
        $user = $this->studentUser($request);
        $student = $user->studentProfile;
        $payload = $request->validated();
        $batchId = $payload['ojt_batch_id'] ?? $student->ojt_batch_id;

        if (! $batchId) {
            throw ValidationException::withMessages([
                'ojt_batch_id' => 'An OJT batch is required for a placement request.',
            ]);
        }

        $hasActivePlacement = Placement::query()
            ->where('student_id', $student->id)
            ->whereIn('status', ['approved', 'active'])
            ->exists();

        if ($hasActivePlacement) {
            throw ValidationException::withMessages([
                'company_id' => 'You already have an active placement. Contact your coordinator.',
            ]);
        }

        $alreadyRequestedForBatch = Placement::query()
            ->where('student_id', $student->id)
            ->where('ojt_batch_id', $batchId)
            ->exists();

        if ($alreadyRequestedForBatch) {
            throw ValidationException::withMessages([
                'ojt_batch_id' => 'You already have a placement for the selected batch.',
            ]);
        }

        $placement = $this->placementService->create([
            'student_id' => $student->id,
            'company_id' => $payload['company_id'],
            'supervisor_id' => null,
            'adviser_id' => null,
            'ojt_batch_id' => $batchId,
            'required_hours' => $student->required_hours ?? 486,
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'] ?? null,
            'status' => 'pending',
        ], $user->id, $user);

        $placement->load([
            'company:id,name,address,contact_person,email,phone',
            'supervisor.user:id,name,email',
            'adviser.user:id,name,email',
            'batch:id,name,school_year,semester,start_date,end_date',
        ]);

        return response()->json([
            'message' => 'Placement request submitted successfully.',
            'data' => new PlacementResource($placement),
        ], 201);
    }
}
