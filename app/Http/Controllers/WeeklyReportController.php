<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StoreWeeklyReportRequest;
use App\Http\Requests\UpdateWeeklyReportRequest;
use App\Enums\UserRole;
use App\Models\Placement;
use App\Models\WeeklyReport;
use App\Models\User;
use App\Repositories\Contracts\WeeklyReportRepositoryInterface;
use App\Services\WeeklyReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WeeklyReportController extends Controller
{
    use NotifiesUser;

    public function __construct(
        private readonly WeeklyReportService $weeklyReportService,
        private readonly WeeklyReportRepositoryInterface $weeklyReportRepository,
    ) {
    }

    public function index(Request $request): Response
    {
        $placementScope = $this->resolvePlacementScope($request->user());
        $role = $request->user()?->role?->value ?? (string) $request->user()?->role;
        $canViewAll = in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
        $placementIdParam = $request->has('placement_id') ? (int) $request->input('placement_id') : null;
        $perPage = (int) $request->input('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $search = $request->string('search')->toString();
        $sort = $request->string('sort')->toString() ?: 'week_start';
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

        return Inertia::render('WeeklyReports/Index', [
            'placements' => $placements,
            'selectedPlacementId' => $placementId,
            'weeklyReports' => $placementId === 0
                ? $this->weeklyReportRepository->paginateForPlacements($placementScope, $perPage, $search, $sort, $direction)
                : ($placementId > 0
                    ? $this->weeklyReportRepository->paginateForPlacement($placementId, $perPage, $search, $sort, $direction)
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

        return Inertia::render('WeeklyReports/Create', [
            'placements' => Placement::query()
                ->with(['student.user', 'company'])
                ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
                ->get(),
            'selectedPlacementId' => $placementId,
        ]);
    }

    public function store(StoreWeeklyReportRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $placement = Placement::findOrFail((int) $validated['placement_id']);
        $this->authorize('submitWeeklyReport', $placement);

        $this->weeklyReportService->create($validated, $request->user());
        $this->toast($request->user()?->id, 'Report submitted', 'Your weekly report has been submitted.');

        return to_route('weekly-reports.index', [
            'placement_id' => $placement->id,
        ]);
    }

    public function update(UpdateWeeklyReportRequest $request, WeeklyReport $weeklyReport): RedirectResponse
    {
        $weeklyReport->loadMissing('placement');
        $this->authorize('review', $weeklyReport);

        $attributes = $request->validated();
        $attributes['reviewer_id'] = $request->user()?->id;

        $this->weeklyReportService->update($weeklyReport, $attributes, $request->user());
        $this->toast($request->user()?->id, 'Report updated', 'Weekly report has been updated.');

        return back();
    }

    public function destroy(WeeklyReport $weeklyReport): RedirectResponse
    {
        $this->authorize('delete', $weeklyReport);

        $this->weeklyReportService->delete($weeklyReport);
        $this->toast(request()->user()?->id, 'Report deleted', 'Weekly report has been deleted.');

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
