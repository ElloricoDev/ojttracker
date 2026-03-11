<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StoreEvaluationRequest;
use App\Http\Requests\UpdateEvaluationRequest;
use App\Enums\UserRole;
use App\Models\Evaluation;
use App\Models\Placement;
use App\Models\User;
use App\Repositories\Contracts\EvaluationRepositoryInterface;
use App\Services\EvaluationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EvaluationController extends Controller
{
    use NotifiesUser;
    public function __construct(
        private readonly EvaluationService $evaluationService,
        private readonly EvaluationRepositoryInterface $evaluationRepository,
    ) {
    }

    public function index(Request $request): Response
    {
        $placementScope = $this->resolvePlacementScope($request->user());
        $placementId = (int) $request->integer('placement_id');
        $perPage = (int) $request->input('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $search = $request->string('search')->toString();
        $sort = $request->string('sort')->toString() ?: 'evaluated_at';
        $direction = $request->string('direction')->toString() ?: 'desc';

        $placementId = $this->resolvePlacementId($request, $placementScope);
        $placements = Placement::query()
            ->with(['student.user', 'company'])
            ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
            ->get();

        return Inertia::render('Evaluations/Index', [
            'placements' => $placements,
            'selectedPlacementId' => $placementId,
            'evaluations' => $placementId > 0
                ? $this->evaluationRepository->paginateForPlacement($placementId, $perPage, $search, $sort, $direction)
                : ['data' => []],
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

        return Inertia::render('Evaluations/Create', [
            'placements' => Placement::query()
                ->with(['student.user', 'company'])
                ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
                ->get(),
            'selectedPlacementId' => $placementId,
        ]);
    }

    public function store(StoreEvaluationRequest $request): RedirectResponse
    {
        $placement = Placement::findOrFail((int) $request->integer('placement_id'));
        $this->authorize('createEvaluation', $placement);

        $this->evaluationService->create($request->validated(), $request->user());
        $this->toast($request->user()?->id, 'Evaluation submitted', 'Evaluation has been submitted.');

        return back();
    }

    public function update(UpdateEvaluationRequest $request, Evaluation $evaluation): RedirectResponse
    {
        $this->evaluationService->update($evaluation, $request->validated());
        $this->toast(request()->user()?->id, 'Evaluation updated', 'Evaluation has been updated.');

        return back();
    }

    public function destroy(Evaluation $evaluation): RedirectResponse
    {
        $this->assertEvaluatorRole(request()->user());
        $this->authorize('delete', $evaluation);

        $this->evaluationService->delete($evaluation, request()->user());
        $this->toast(request()->user()?->id, 'Evaluation deleted', 'Evaluation has been deleted.');

        return back();
    }

    private function assertEvaluatorRole(?User $user): void
    {
        if (! $user) {
            abort(403);
        }

        $allowed = [
            UserRole::Admin->value,
            UserRole::Coordinator->value,
            UserRole::Adviser->value,
            UserRole::Supervisor->value,
        ];

        $role = $user->role?->value ?? (string) $user->role;

        if (! in_array($role, $allowed, true)) {
            abort(403);
        }
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

