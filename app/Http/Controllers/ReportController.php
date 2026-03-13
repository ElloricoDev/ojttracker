<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\AttendanceLog;
use App\Models\DailyReport;
use App\Models\Placement;
use App\Models\User;
use App\Models\WeeklyReport;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        $this->authorizeReportsAccess();

        $user = request()->user();
        $placementScope = $this->resolvePlacementScope($user);
        $companySearch = request('company_search');
        $courseSearch = request('course_search');
        $companyPerPage = (int) request('company_per_page', 10);
        $coursePerPage = (int) request('course_per_page', 10);
        $trendMonths = $this->normalizeTrendMonths((int) request('trend_months', 6));

        [$placements, $hoursRendered, $perCompany, $perCourse, $analytics] = $this->buildReportData($placementScope, $trendMonths);
        $perCompany = $this->applyLabelSearch($perCompany, $companySearch);
        $perCourse = $this->applyLabelSearch($perCourse, $courseSearch);

        $query = request()->except(['company_page', 'course_page']);
        $paginatedCompany = $this->paginateCollection($perCompany, $companyPerPage, 'company_page', $query);
        $paginatedCourse = $this->paginateCollection($perCourse, $coursePerPage, 'course_page', $query);

        $totalPlacements = $placements->count();
        $completedPlacements = $placements->where('status', 'completed')->count();
        $activePlacements = $placements->where('status', 'active')->count();
        $pendingPlacements = $placements->where('status', 'pending')->count();
        $totalHours = round(array_sum($hoursRendered), 2);
        $completionRate = $totalPlacements > 0
            ? round(($completedPlacements / $totalPlacements) * 100, 2)
            : 0;
        $averageHoursPerPlacement = $totalPlacements > 0
            ? round($totalHours / $totalPlacements, 2)
            : 0;

        return Inertia::render('Reports/Index', [
            'stats' => [
                'totalPlacements' => $totalPlacements,
                'activePlacements' => $activePlacements,
                'pendingPlacements' => $pendingPlacements,
                'completedPlacements' => $completedPlacements,
                'completionRate' => $completionRate,
                'hoursRendered' => $totalHours,
                'averageHoursPerPlacement' => $averageHoursPerPlacement,
                'studentsTracked' => count($analytics['topStudents']),
            ],
            'perCompany' => $paginatedCompany,
            'perCourse' => $paginatedCourse,
            'analytics' => $analytics,
            'filters' => request()->only('company_search', 'course_search', 'company_per_page', 'course_per_page', 'trend_months'),
        ]);
    }

    public function exportCompany()
    {
        $this->authorizeReportsAccess();

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
        $this->authorizeReportsAccess();

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

    private function authorizeReportsAccess(): void
    {
        if (Gate::allows('view-reports')) {
            return;
        }

        $role = strtolower(trim(request()->user()?->role?->value ?? (string) request()->user()?->role));
        $allowed = [
            UserRole::Admin->value,
            UserRole::Coordinator->value,
            UserRole::Adviser->value,
            UserRole::Supervisor->value,
            UserRole::Student->value,
        ];

        abort_unless(in_array($role, $allowed, true), 403, 'This action is unauthorized.');
    }

    private function buildReportData(?array $placementScope, int $trendMonths = 6): array
    {
        $trendMonths = $this->normalizeTrendMonths($trendMonths);

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

        $analytics = [
            'trendMonths' => $trendMonths,
            'monthlyHours' => $this->buildMonthlyHoursTrend($placementScope, $trendMonths),
            'placementStatus' => $this->buildPlacementStatusBreakdown($placements),
            'attendanceStatus' => $this->buildAttendanceStatusBreakdown($placementScope),
            'reportStatus' => $this->buildReportStatusBreakdown($placementScope),
            'topStudents' => $this->buildTopStudentsAnalytics($placements, $hoursRendered),
        ];

        return [$placements, $hoursRendered, $perCompany, $perCourse, $analytics];
    }

    private function buildPlacementStatusBreakdown($placements): array
    {
        $total = $placements->count();

        if ($total === 0) {
            return [];
        }

        return $placements
            ->groupBy(fn ($placement) => strtolower((string) ($placement->status ?: 'unknown')))
            ->map(function ($group, $status) use ($total) {
                $count = $group->count();

                return [
                    'status' => $status,
                    'label' => $this->formatStatusLabel($status),
                    'count' => $count,
                    'percentage' => round(($count / $total) * 100, 2),
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    private function buildAttendanceStatusBreakdown(?array $placementScope): array
    {
        $rows = AttendanceLog::query()
            ->select('status', DB::raw('COUNT(*) as logs_count'), DB::raw('SUM(total_minutes) as total_minutes'))
            ->when($placementScope !== null, fn ($query) => $query->whereIn('placement_id', $placementScope))
            ->groupBy('status')
            ->get();

        $total = (int) $rows->sum('logs_count');

        if ($total === 0) {
            return [];
        }

        return $rows
            ->map(function ($row) use ($total) {
                $count = (int) $row->logs_count;
                $minutes = (int) ($row->total_minutes ?? 0);
                $status = strtolower((string) ($row->status ?: 'unknown'));

                return [
                    'status' => $status,
                    'label' => $this->formatStatusLabel($status),
                    'count' => $count,
                    'hours' => round($minutes / 60, 2),
                    'percentage' => round(($count / $total) * 100, 2),
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    private function buildReportStatusBreakdown(?array $placementScope): array
    {
        $dailyRows = DailyReport::query()
            ->select('status', DB::raw('COUNT(*) as reports_count'))
            ->when($placementScope !== null, fn ($query) => $query->whereIn('placement_id', $placementScope))
            ->groupBy('status')
            ->get();

        $weeklyRows = WeeklyReport::query()
            ->select('status', DB::raw('COUNT(*) as reports_count'))
            ->when($placementScope !== null, fn ($query) => $query->whereIn('placement_id', $placementScope))
            ->groupBy('status')
            ->get();

        $combined = collect();

        foreach ($dailyRows as $row) {
            $status = strtolower((string) ($row->status ?: 'unknown'));
            $count = (int) $row->reports_count;
            $current = $combined->get($status, [
                'status' => $status,
                'label' => $this->formatStatusLabel($status),
                'daily' => 0,
                'weekly' => 0,
                'count' => 0,
            ]);
            $current['daily'] += $count;
            $current['count'] += $count;
            $combined->put($status, $current);
        }

        foreach ($weeklyRows as $row) {
            $status = strtolower((string) ($row->status ?: 'unknown'));
            $count = (int) $row->reports_count;
            $current = $combined->get($status, [
                'status' => $status,
                'label' => $this->formatStatusLabel($status),
                'daily' => 0,
                'weekly' => 0,
                'count' => 0,
            ]);
            $current['weekly'] += $count;
            $current['count'] += $count;
            $combined->put($status, $current);
        }

        $total = (int) $combined->sum('count');

        if ($total === 0) {
            return [];
        }

        return $combined
            ->map(function ($row) use ($total) {
                $row['percentage'] = round(($row['count'] / $total) * 100, 2);

                return $row;
            })
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    private function buildMonthlyHoursTrend(?array $placementScope, int $trendMonths): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths($trendMonths - 1);

        $rows = AttendanceLog::query()
            ->selectRaw('YEAR(work_date) as year_num, MONTH(work_date) as month_num, COUNT(*) as logs_count, SUM(total_minutes) as total_minutes')
            ->when($placementScope !== null, fn ($query) => $query->whereIn('placement_id', $placementScope))
            ->whereDate('work_date', '>=', $start->toDateString())
            ->groupBy('year_num', 'month_num')
            ->orderBy('year_num')
            ->orderBy('month_num')
            ->get();

        $byMonth = $rows->keyBy(fn ($row) => sprintf('%04d-%02d', (int) $row->year_num, (int) $row->month_num));

        $trend = collect();

        for ($i = 0; $i < $trendMonths; $i++) {
            $monthDate = $start->copy()->addMonths($i);
            $key = $monthDate->format('Y-m');
            $row = $byMonth->get($key);
            $hours = round(((int) ($row?->total_minutes ?? 0)) / 60, 2);

            $trend->push([
                'key' => $key,
                'label' => $monthDate->format('M Y'),
                'hours' => $hours,
                'logs' => (int) ($row?->logs_count ?? 0),
            ]);
        }

        $maxHours = (float) $trend->max('hours');
        if ($maxHours <= 0) {
            $maxHours = 1;
        }

        return $trend->map(function ($row) use ($maxHours) {
            $row['bar'] = $row['hours'] > 0
                ? round(($row['hours'] / $maxHours) * 100, 2)
                : 0;

            return $row;
        })->all();
    }

    private function buildTopStudentsAnalytics($placements, array $hoursRendered): array
    {
        return $placements
            ->groupBy('student_id')
            ->map(function ($group) use ($hoursRendered) {
                $sample = $group->first();
                $hours = round($group->sum(fn ($placement) => $hoursRendered[$placement->id] ?? 0), 2);
                $completed = $group->where('status', 'completed')->count();

                return [
                    'student' => $sample->student?->user?->name ?? 'Unknown',
                    'course' => $sample->student?->course ?? 'Unknown',
                    'placements' => $group->count(),
                    'completed' => $completed,
                    'hours' => $hours,
                ];
            })
            ->sortByDesc('hours')
            ->take(8)
            ->values()
            ->all();
    }

    private function normalizeTrendMonths(int $trendMonths): int
    {
        return in_array($trendMonths, [3, 6, 12], true) ? $trendMonths : 6;
    }

    private function formatStatusLabel(?string $status): string
    {
        $normalized = strtolower(trim((string) $status));

        if ($normalized === '') {
            return 'Unknown';
        }

        return ucwords(str_replace('_', ' ', $normalized));
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
