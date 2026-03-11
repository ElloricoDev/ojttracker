<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StorePlacementRequest;
use App\Http\Requests\StorePlacementRequestForStudent;
use App\Http\Requests\UpdatePlacementRequest;
use App\Enums\UserRole;
use App\Models\Adviser;
use App\Models\Company;
use App\Models\OjtBatch;
use App\Models\Placement;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\User;
use App\Repositories\Contracts\PlacementRepositoryInterface;
use App\Services\PlacementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlacementController extends Controller
{
    use NotifiesUser;
    public function __construct(
        private readonly PlacementRepositoryInterface $placementRepository,
        private readonly PlacementService $placementService,
    ) {
    }

    public function index(Request $request): Response
    {
        $placementScope = $this->resolvePlacementScope($request->user());
        $filters = $request->only(['search', 'status']);
        $perPage = (int) $request->input('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $sort = $request->string('sort')->toString() ?: 'created_at';
        $direction = $request->string('direction')->toString() ?: 'desc';

        return Inertia::render('Placements/Index', [
            'placements' => $this->placementRepository->paginate($filters, $perPage, $sort, $direction, $placementScope),
            'filters' => array_merge($filters, ['per_page' => $perPage, 'sort' => $sort, 'direction' => $direction]),
        ]);
    }

    public function request(): Response
    {
        $user = request()->user();

        if (! $user || ! $user->hasRole(UserRole::Student)) {
            abort(403);
        }

        $student = $user->studentProfile;
        if (! $student) {
            abort(403);
        }

        return Inertia::render('Placements/Request', [
            'student' => [
                'id' => $student->id,
                'name' => $user->name,
                'required_hours' => $student->required_hours ?? 486,
                'ojt_batch_id' => $student->ojt_batch_id,
            ],
            'companies' => Company::query()->where('is_active', true)->get(['id', 'name']),
            'batches' => OjtBatch::query()->get(['id', 'name']),
        ]);
    }

    public function storeRequest(StorePlacementRequestForStudent $request): RedirectResponse
    {
        $user = $request->user();
        $student = $user?->studentProfile;

        if (! $user || ! $student) {
            abort(403);
        }

        $payload = $request->validated();
        $batchId = $payload['ojt_batch_id'] ?? $student->ojt_batch_id;

        if (! $batchId) {
            throw ValidationException::withMessages([
                'ojt_batch_id' => 'An OJT batch is required for a placement request.',
            ]);
        }

        $hasActive = Placement::where('student_id', $student->id)
            ->whereIn('status', ['approved', 'active'])
            ->exists();

        if ($hasActive) {
            throw ValidationException::withMessages([
                'company_id' => 'You already have an active placement. Contact your coordinator.',
            ]);
        }

        $exists = Placement::where('student_id', $student->id)
            ->where('ojt_batch_id', $batchId)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'ojt_batch_id' => 'You already have a placement for the selected batch.',
            ]);
        }

        $attributes = [
            'student_id' => $student->id,
            'company_id' => $payload['company_id'],
            'supervisor_id' => null,
            'adviser_id' => null,
            'ojt_batch_id' => $batchId,
            'required_hours' => $student->required_hours ?? 486,
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'] ?? null,
            'status' => 'pending',
        ];

        $this->placementService->create($attributes, $user->id, $user);
        $this->toast($user->id, 'Placement requested', 'Your placement request has been submitted.');

        return to_route('placements.index');
    }

    public function create(): Response
    {
        return Inertia::render('Placements/Create', [
            'students' => Student::query()
                ->whereDoesntHave('placements')
                ->with('user:id,name')
                ->get(['id', 'user_id', 'student_no']),
            'companies' => Company::query()->get(['id', 'name']),
            'supervisors' => Supervisor::with('user:id,name')->get(['id', 'user_id']),
            'advisers' => Adviser::with('user:id,name')->get(['id', 'user_id']),
            'batches' => OjtBatch::query()->get(['id', 'name']),
        ]);
    }

    public function store(StorePlacementRequest $request): RedirectResponse
    {
        $this->placementService->create($request->validated(), $request->user()?->id, $request->user());
        $this->toast($request->user()?->id, 'Placement created', 'Placement has been created.');

        return to_route('placements.index');
    }

    public function edit(Placement $placement): Response
    {
        return Inertia::render('Placements/Edit', [
            'placement' => $placement->load(['student.user', 'company', 'supervisor.user', 'adviser.user', 'batch']),
            'companies' => Company::query()->get(['id', 'name']),
            'supervisors' => Supervisor::with('user:id,name')->get(['id', 'user_id']),
            'advisers' => Adviser::with('user:id,name')->get(['id', 'user_id']),
        ]);
    }

    public function update(UpdatePlacementRequest $request, Placement $placement): RedirectResponse
    {
        $this->placementService->update($placement, $request->validated(), $request->user());
        $this->toast($request->user()?->id, 'Placement updated', 'Placement has been updated.');

        return to_route('placements.index');
    }

    public function destroy(Placement $placement): RedirectResponse
    {
        $this->placementService->delete($placement, request()->user());
        $this->toast(request()->user()?->id, 'Placement deleted', 'Placement has been deleted.');

        return to_route('placements.index');
    }

    public function approve(Placement $placement): RedirectResponse
    {
        $this->placementService->approve($placement, request()->user());
        $this->toast(request()->user()?->id, 'Placement approved', 'Placement has been approved.');

        return back();
    }

    public function activate(Placement $placement): RedirectResponse
    {
        $this->placementService->activate($placement, request()->user());
        $this->toast(request()->user()?->id, 'Placement activated', 'Placement is now active.');

        return back();
    }

    public function complete(Placement $placement): RedirectResponse
    {
        $this->placementService->complete($placement, request()->user());
        $this->toast(request()->user()?->id, 'Placement completed', 'Placement has been completed.');

        return back();
    }

    public function cancel(Placement $placement): RedirectResponse
    {
        $this->placementService->cancel($placement, request()->user());
        $this->toast(request()->user()?->id, 'Placement cancelled', 'Placement has been cancelled.');

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
