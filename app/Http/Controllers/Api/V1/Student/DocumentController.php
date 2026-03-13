<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\Api\V1\DocumentResource;
use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends StudentApiController
{
    public function __construct(private readonly DocumentService $documentService)
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
        $sort = $request->string('sort')->toString() ?: 'submitted_at';
        $allowedSorts = ['submitted_at', 'status', 'document_type', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'submitted_at';
        $sortDirection = $this->direction($request);

        $documents = Document::query()
            ->with([
                'placement:id,student_id,company_id,status,start_date,end_date',
                'placement.company:id,name',
                'verifier:id,name',
            ])
            ->whereHas('placement', fn ($query) => $query->where('student_id', $student->id))
            ->when($placementId !== null, fn ($query) => $query->where('placement_id', $placementId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('document_type', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($this->perPage($request))
            ->withQueryString();

        return $this->paginatedResponse($documents, DocumentResource::class);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $user = $this->studentUser($request);
        $student = $user->studentProfile;
        $placement = $this->ownedPlacement($student, (int) $request->integer('placement_id'));
        $this->authorize('uploadDocument', $placement);

        $document = $this->documentService->create(
            $request->validated(),
            $request->file('document_file'),
            $user
        );

        $document->loadMissing(['placement.company:id,name', 'verifier:id,name']);

        return response()->json([
            'message' => 'Document uploaded successfully.',
            'data' => new DocumentResource($document),
        ], 201);
    }
}
