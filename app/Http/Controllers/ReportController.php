<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\AttendanceLog;
use App\Models\Placement;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('view-reports');

        $user = request()->user();
        $placementScope = $this->resolvePlacementScope($user);
        $companySearch = request('company_search');
        $courseSearch = request('course_search');
        $companyPerPage = (int) request('company_per_page', 10);
        $coursePerPage = (int) request('course_per_page', 10);

        [$placements, $hoursRendered, $perCompany, $perCourse] = $this->buildReportData($placementScope);
        $perCompany = $this->applyLabelSearch($perCompany, $companySearch);
        $perCourse = $this->applyLabelSearch($perCourse, $courseSearch);

        $query = request()->except(['company_page', 'course_page']);
        $paginatedCompany = $this->paginateCollection($perCompany, $companyPerPage, 'company_page', $query);
        $paginatedCourse = $this->paginateCollection($perCourse, $coursePerPage, 'course_page', $query);

        $completionRate = $placements->count() > 0
            ? round(($placements->where('status', 'completed')->count() / $placements->count()) * 100, 2)
            : 0;

        return Inertia::render('Reports/Index', [
            'stats' => [
                'totalPlacements' => $placements->count(),
                'completedPlacements' => $placements->where('status', 'completed')->count(),
                'completionRate' => $completionRate,
                'hoursRendered' => round(array_sum($hoursRendered), 2),
            ],
            'perCompany' => $paginatedCompany,
            'perCourse' => $paginatedCourse,
            'filters' => request()->only('company_search', 'course_search', 'company_per_page', 'course_per_page'),
        ]);
    }

    public function exportCompany()
    {
        Gate::authorize('view-reports');

        $placementScope = $this->resolvePlacementScope(request()->user());
        [, , $perCompany] = $this->buildReportData($placementScope);
        $perCompany = $this->applyLabelSearch($perCompany, request('company_search'));

        return $this->streamCsv('report-per-company.csv', $perCompany, [
            'Company',
            'Placements',
            'Hours Rendered',
            'Completed',
        ]);
    }

    public function exportCourse()
    {
        Gate::authorize('view-reports');

        $placementScope = $this->resolvePlacementScope(request()->user());
        [, , , $perCourse] = $this->buildReportData($placementScope);
        $perCourse = $this->applyLabelSearch($perCourse, request('course_search'));

        return $this->streamCsv('report-per-course.csv', $perCourse, [
            'Course',
            'Placements',
            'Hours Rendered',
            'Completed',
        ]);
    }

    private function paginateCollection($items, int $perPage, string $pageName, array $query): LengthAwarePaginator
    {
        $page = LengthAwarePaginator::resolveCurrentPage($pageName);
        $total = $items->count();
        $results = $items->forPage($page, $perPage)->values();

        return new LengthAwarePaginator($results, $total, $perPage, $page, [
            'path' => request()->url(),
            'pageName' => $pageName,
            'query' => $query,
        ]);
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

    private function buildReportData(?array $placementScope): array
    {
        $placements = Placement::query()
            ->with(['student.user', 'company'])
            ->when($placementScope !== null, fn ($query) => $query->whereIn('id', $placementScope))
            ->get(['id', 'student_id', 'company_id', 'status', 'required_hours']);

        $hoursByPlacement = AttendanceLog::query()
            ->select('placement_id', DB::raw('SUM(total_minutes) as total_minutes'))
            ->when($placementScope !== null, fn ($query) => $query->whereIn('placement_id', $placementScope))
            ->groupBy('placement_id')
            ->pluck('total_minutes', 'placement_id');

        $hoursRendered = [];
        foreach ($placements as $placement) {
            $minutes = (int) ($hoursByPlacement[$placement->id] ?? 0);
            $hoursRendered[$placement->id] = round($minutes / 60, 2);
        }

        $perCompany = $placements->groupBy(fn ($placement) => $placement->company?->name ?? 'Unknown')
            ->map(function ($group) use ($hoursRendered) {
                $totalHours = $group->sum(fn ($placement) => $hoursRendered[$placement->id] ?? 0);
                $completed = $group->where('status', 'completed')->count();

                return [
                    'placements' => $group->count(),
                    'hours' => round($totalHours, 2),
                    'completed' => $completed,
                ];
            })
            ->sortByDesc('placements');

        $perCourse = $placements->groupBy(fn ($placement) => $placement->student?->course ?? 'Unknown')
            ->map(function ($group) use ($hoursRendered) {
                $totalHours = $group->sum(fn ($placement) => $hoursRendered[$placement->id] ?? 0);
                $completed = $group->where('status', 'completed')->count();

                return [
                    'placements' => $group->count(),
                    'hours' => round($totalHours, 2),
                    'completed' => $completed,
                ];
            })
            ->sortByDesc('placements');

        $perCompany = $perCompany->map(function ($row, $company) {
            return [
                'label' => $company,
                ...$row,
            ];
        })->values();

        $perCourse = $perCourse->map(function ($row, $course) {
            return [
                'label' => $course,
                ...$row,
            ];
        })->values();

        return [$placements, $hoursRendered, $perCompany, $perCourse];
    }

    private function applyLabelSearch($rows, ?string $search)
    {
        if (! $search) {
            return $rows;
        }

        $needle = strtolower($search);

        return $rows->filter(function ($row) use ($needle) {
            return str_contains(strtolower($row['label']), $needle);
        })->values();
    }

    private function streamCsv(string $filename, $rows, array $headers)
    {
        $callback = function () use ($rows, $headers) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['label'],
                    $row['placements'],
                    $row['hours'],
                    $row['completed'],
                ]);
            }

            fclose($handle);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
