<?php

namespace App\Providers;

use App\Models\AttendanceLog;
use App\Models\DailyReport;
use App\Models\WeeklyReport;
use App\Models\Document;
use App\Models\Evaluation;
use App\Models\Placement;
use App\Models\Company;
use App\Models\User;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\Notification;
use App\Models\AuditLog;
use App\Models\OjtBatch;
use App\Policies\AttendanceLogPolicy;
use App\Policies\DailyReportPolicy;
use App\Policies\WeeklyReportPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\EvaluationPolicy;
use App\Policies\PlacementPolicy;
use App\Policies\CompanyPolicy;
use App\Policies\UserPolicy;
use App\Policies\StudentPolicy;
use App\Policies\SupervisorPolicy;
use App\Policies\NotificationPolicy;
use App\Policies\AuditLogPolicy;
use App\Policies\ReportPolicy;
use App\Policies\OjtBatchPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Placement::class => PlacementPolicy::class,
        AttendanceLog::class => AttendanceLogPolicy::class,
        DailyReport::class => DailyReportPolicy::class,
        WeeklyReport::class => WeeklyReportPolicy::class,
        Document::class => DocumentPolicy::class,
        Evaluation::class => EvaluationPolicy::class,
        Company::class => CompanyPolicy::class,
        User::class => UserPolicy::class,
        Student::class => StudentPolicy::class,
        Supervisor::class => SupervisorPolicy::class,
        Notification::class => NotificationPolicy::class,
        AuditLog::class => AuditLogPolicy::class,
        OjtBatch::class => OjtBatchPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
        Gate::before(function ($user) {
            $role = strtolower(trim($user->role?->value ?? (string) $user->role));
            return $role === 'admin' ? true : null;
        });
        Gate::define('view-reports', [ReportPolicy::class, 'view']);
    }
}
