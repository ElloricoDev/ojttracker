<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOjtBatchRequest;
use App\Http\Requests\UpdateOjtBatchRequest;
use App\Models\OjtBatch;
use App\Support\NotifiesUser;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OjtBatchController extends Controller
{
    use NotifiesUser;
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', OjtBatch::class);

        $search = request('search');
        $perPage = (int) request('per_page', 10);
        $sort = request('sort', 'start_date');
        $direction = request('direction', 'desc');
        $allowedSorts = ['name', 'school_year', 'semester', 'start_date', 'end_date', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'start_date';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $batches = OjtBatch::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('school_year', 'like', "%{$search}%")
                        ->orWhere('semester', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (OjtBatch $batch) => [
                'id' => $batch->id,
                'name' => $batch->name,
                'school_year' => $batch->school_year,
                'semester' => $batch->semester,
                'start_date' => $batch->start_date?->toDateString(),
                'end_date' => $batch->end_date?->toDateString(),
            ]);

        return Inertia::render('Batches/Index', [
            'batches' => $batches,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortColumn,
                'direction' => $sortDirection,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', OjtBatch::class);

        return Inertia::render('Batches/Create');
    }

    public function store(StoreOjtBatchRequest $request): RedirectResponse
    {
        $this->authorize('create', OjtBatch::class);

        $batch = OjtBatch::create($request->validated());
        $this->auditLogService->log(
            $request->user(),
            'batch.created',
            OjtBatch::class,
            $batch->id
        );
        $this->toast($request->user()?->id, 'Batch created', 'OJT batch has been created.');

        return to_route('batches.index');
    }

    public function edit(OjtBatch $batch): Response
    {
        $this->authorize('update', $batch);

        return Inertia::render('Batches/Edit', [
            'batch' => $batch,
        ]);
    }

    public function update(UpdateOjtBatchRequest $request, OjtBatch $batch): RedirectResponse
    {
        $this->authorize('update', $batch);

        $batch->update($request->validated());
        $this->auditLogService->log(
            $request->user(),
            'batch.updated',
            OjtBatch::class,
            $batch->id
        );
        $this->toast($request->user()?->id, 'Batch updated', 'OJT batch has been updated.');

        return to_route('batches.index');
    }

    public function destroy(OjtBatch $batch): RedirectResponse
    {
        $this->authorize('delete', $batch);

        if ($batch->placements()->exists()) {
            abort(409, 'Cannot delete a batch with placements.');
        }

        $batch->delete();
        $this->auditLogService->log(
            request()->user(),
            'batch.deleted',
            OjtBatch::class,
            $batch->id
        );
        $this->toast(request()->user()?->id, 'Batch deleted', 'OJT batch has been deleted.');

        return to_route('batches.index');
    }
}
