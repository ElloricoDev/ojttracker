<?php

namespace App\Http\Controllers;

use App\Support\NotifiesUser;
use App\Http\Requests\StoreDailyReportRequest;
use App\Http\Requests\UpdateDailyReportRequest;
use App\Enums\UserRole;
use App\Models\DailyReport;
use App\Models\Placement;
use App\Models\User;
use App\Repositories\Contracts\DailyReportRepositoryInterface;
use App\Services\DailyReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    use NotifiesUser;
    public function __construct(
        private readonly DailyReportService $dailyReportService,
        private readonly DailyReportRepositoryInterface $dailyReportRepository,
    ) {
    }

    public function index(Request $request): Response
    {
        $placementScope = $this->resolvePlacementScope($request->user());
        $placementId = (int) $request->integer('placement_id');
        $perPage = (int) $request->input('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
        $search = $request->string('search')->toString();
        $sort = $request->string('sort')->toString() ?: 'work_date';
        $direction = $request->string('direction')->toString() ?: 'desc';

        $placementId = $this->resolvePlacementId($request, $placementScope);
        $placements = Placement::query()
            ->with(['student.user', 'company'])
            ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
            ->get();

        return Inertia::render('DailyReports/Index', [
            'placements' => $placements,
            'selectedPlacementId' => $placementId,
            'dailyReports' => $placementId > 0
                ? $this->dailyReportRepository->paginateForPlacement($placementId, $perPage, $search, $sort, $direction)
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

        return Inertia::render('DailyReports/Create', [
            'placements' => Placement::query()
                ->with(['student.user', 'company'])
                ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
                ->get(),
            'selectedPlacementId' => $placementId,
        ]);
    }

    public function store(StoreDailyReportRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $placement = Placement::findOrFail((int) $validated['placement_id']);
        $this->authorize('submitDailyReport', $placement);

        $this->dailyReportService->create($validated, $request->user());
        $this->toast($request->user()?->id, 'Report submitted', 'Your daily report has been submitted.');

        return back();
    }

    public function update(UpdateDailyReportRequest $request, DailyReport $dailyReport): RedirectResponse
    {
        $dailyReport->loadMissing('placement');
        $this->authorize('review', $dailyReport);

        $attributes = $request->validated();
        $attributes['reviewer_id'] = $request->user()?->id;

        $this->dailyReportService->update($dailyReport, $attributes, $request->user());
        $this->toast($request->user()?->id, 'Report updated', 'Daily report has been updated.');

        return back();
    }

    public function destroy(DailyReport $dailyReport): RedirectResponse
    {
        $this->authorize('delete', $dailyReport);

        $this->dailyReportService->delete($dailyReport);
        $this->toast(request()->user()?->id, 'Report deleted', 'Daily report has been deleted.');

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
