<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StoreSupervisorRequest;
use App\Http\Requests\UpdateSupervisorRequest;
use App\Models\Company;
use App\Models\Supervisor;
use App\Services\SupervisorService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SupervisorController extends Controller
{
    use NotifiesUser;
    public function __construct(private readonly SupervisorService $supervisorService)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', Supervisor::class);
        $search = request('search');
        $perPage = (int) request('per_page', 10);
        $sort = request('sort', 'created_at');
        $direction = request('direction', 'desc');
        $allowedSorts = ['position', 'contact_no', 'created_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $supervisors = Supervisor::query()
            ->with(['user', 'company'])
            ->when($search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('position', 'like', "%{$search}%")
                        ->orWhere('contact_no', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('company', function ($companyQuery) use ($search) {
                            $companyQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Supervisor $supervisor) => [
                'id' => $supervisor->id,
                'name' => $supervisor->user?->name,
                'email' => $supervisor->user?->email,
                'company' => $supervisor->company?->name,
                'position' => $supervisor->position,
                'contact_no' => $supervisor->contact_no,
            ]);

        return Inertia::render('Supervisors/Index', [
            'supervisors' => $supervisors,
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
        $this->authorize('create', Supervisor::class);
        return Inertia::render('Supervisors/Create', [
            'companies' => Company::query()->get(['id', 'name']),
        ]);
    }

    public function store(StoreSupervisorRequest $request): RedirectResponse
    {
        $this->authorize('create', Supervisor::class);
        $this->supervisorService->create($request->validated(), $request->user());
        $this->toast($request->user()?->id, 'Supervisor created', 'Supervisor account has been created.');

        return to_route('supervisors.index');
    }

    public function edit(Supervisor $supervisor): Response
    {
        $this->authorize('update', $supervisor);
        return Inertia::render('Supervisors/Edit', [
            'supervisor' => $supervisor->load(['user', 'company']),
            'companies' => Company::query()->get(['id', 'name']),
        ]);
    }

    public function update(UpdateSupervisorRequest $request, Supervisor $supervisor): RedirectResponse
    {
        $this->authorize('update', $supervisor);
        $this->supervisorService->update($supervisor, $request->validated(), $request->user());
        $this->toast($request->user()?->id, 'Supervisor updated', 'Supervisor account has been updated.');

        return to_route('supervisors.index');
    }

    public function destroy(Supervisor $supervisor): RedirectResponse
    {
        $this->authorize('delete', $supervisor);
        $this->supervisorService->delete($supervisor, request()->user());
        $this->toast(request()->user()?->id, 'Supervisor deleted', 'Supervisor account has been deleted.');

        return to_route('supervisors.index');
    }
}

