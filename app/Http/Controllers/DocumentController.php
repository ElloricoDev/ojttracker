<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Enums\UserRole;
use App\Models\Document;
use App\Models\Placement;
use App\Models\User;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Services\DocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    use NotifiesUser;
    public function __construct(
        private readonly DocumentService $documentService,
        private readonly DocumentRepositoryInterface $documentRepository,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Document::class);
        $placementScope = $this->resolvePlacementScope($request->user());
        $role = $request->user()?->role?->value ?? (string) $request->user()?->role;
        $canViewAll = in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
        $placementIdParam = $request->has('placement_id') ? (int) $request->input('placement_id') : null;
        $perPage = (int) $request->input('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $search = $request->string('search')->toString();
        $sort = $request->string('sort')->toString() ?: 'submitted_at';
        $direction = $request->string('direction')->toString() ?: 'desc';

        if ($canViewAll && ($placementIdParam === null || $placementIdParam === 0)) {
            $placementId = 0;
        } else {
            $placementId = $this->resolvePlacementId($request, $placementScope);
        }
        $placements = Placement::query()
            ->with(['student.user', 'company'])
            ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
            ->get();

        return Inertia::render('Documents/Index', [
            'placements' => $placements,
            'selectedPlacementId' => $placementId,
            'documents' => $placementId === 0
                ? $this->documentRepository->paginateForPlacements($placementScope, $perPage, $search, $sort, $direction)
                : ($placementId > 0
                    ? $this->documentRepository->paginateForPlacement($placementId, $perPage, $search, $sort, $direction)
                    : ['data' => []]),
            'canViewAll' => $canViewAll,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $placementScope = $this->resolvePlacementScope($request->user());
        $placementId = $this->resolvePlacementId($request, $placementScope);

        return Inertia::render('Documents/Create', [
            'placements' => Placement::query()
                ->with(['student.user', 'company'])
                ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
                ->get(),
            'selectedPlacementId' => $placementId,
        ]);
    }

    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        $placement = Placement::findOrFail((int) $request->integer('placement_id'));
        $this->authorize('uploadDocument', $placement);

        $this->documentService->create($request->validated(), $request->file('document_file'), $request->user());
        $this->toast($request->user()?->id, 'Document uploaded', 'Your document has been uploaded.');

        return to_route('documents.index', [
            'placement_id' => $placement->id,
        ]);
    }

    public function update(UpdateDocumentRequest $request, Document $document): RedirectResponse
    {
        $document->loadMissing('placement');
        $this->authorize('verify', $document);

        $this->documentService->update($document, $request->validated(), $request->user());
        $this->toast($request->user()?->id, 'Document updated', 'Document status has been updated.');

        return back();
    }

    public function destroy(Document $document): RedirectResponse
    {
        $document->loadMissing('placement');
        $this->authorize('delete', $document);

        $this->documentService->delete($document, request()->user());
        $this->toast(request()->user()?->id, 'Document deleted', 'Document has been deleted.');

        return back();
    }

    public function download(Document $document)
    {
        $document->loadMissing('placement');
        $this->authorize('view', $document);

        $filename = basename($document->file_path);
        if ($document->file_path && Storage::disk('local')->exists($document->file_path)) {
            return Storage::disk('local')->download($document->file_path, $filename);
        }

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            return Storage::disk('public')->download($document->file_path, $filename);
        }

        abort(404);
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

    private function resolvePlacementId(Request $request, ?array $placementScope): int
    {
        $placementId = (int) $request->integer('placement_id');

        if ($placementId > 0) {
            $this->assertPlacementInScope($placementId, $placementScope);
            return $placementId;
        }

        return (int) Placement::query()
            ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
            ->value('id');
    }

    private function assertPlacementInScope(int $placementId, ?array $placementScope): void
    {
        if ($placementScope !== null && ! in_array($placementId, $placementScope, true)) {
            abort(403);
        }
    }
}
