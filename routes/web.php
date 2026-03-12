<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DailyReportController;
use App\Http\Controllers\WeeklyReportController;
use App\Http\Controllers\DtrController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\PlacementController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SupervisorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OjtBatchController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');

    Route::get('/placements', [PlacementController::class, 'index'])->name('placements.index');

    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/attendance/time-in', [AttendanceController::class, 'timeIn'])->name('attendance.time-in');
    Route::post('/attendance/time-out', [AttendanceController::class, 'timeOut'])->name('attendance.time-out');
    Route::patch('/attendance/{attendanceLog}/approve', [AttendanceController::class, 'approve'])->name('attendance.approve');
    Route::patch('/attendance/{attendanceLog}/reject', [AttendanceController::class, 'reject'])->name('attendance.reject');

    Route::get('/dtr', [DtrController::class, 'index'])->name('dtr.index');
    Route::get('/dtr/data', [DtrController::class, 'generate'])->name('dtr.generate');

    Route::get('/daily-reports', [DailyReportController::class, 'index'])->name('daily-reports.index');
    Route::get('/daily-reports/create', [DailyReportController::class, 'create'])->name('daily-reports.create');
    Route::post('/daily-reports', [DailyReportController::class, 'store'])->name('daily-reports.store');
    Route::patch('/daily-reports/{dailyReport}', [DailyReportController::class, 'update'])->name('daily-reports.update');
    Route::delete('/daily-reports/{dailyReport}', [DailyReportController::class, 'destroy'])->name('daily-reports.destroy');

    Route::get('/weekly-reports', [WeeklyReportController::class, 'index'])->name('weekly-reports.index');
    Route::get('/weekly-reports/create', [WeeklyReportController::class, 'create'])->name('weekly-reports.create');
    Route::post('/weekly-reports', [WeeklyReportController::class, 'store'])->name('weekly-reports.store');
    Route::patch('/weekly-reports/{weeklyReport}', [WeeklyReportController::class, 'update'])->name('weekly-reports.update');
    Route::delete('/weekly-reports/{weeklyReport}', [WeeklyReportController::class, 'destroy'])->name('weekly-reports.destroy');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread', [NotificationController::class, 'unread'])->name('notifications.unread');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');
    Route::get('/evaluations/create', [EvaluationController::class, 'create'])->name('evaluations.create');
    Route::post('/evaluations', [EvaluationController::class, 'store'])->name('evaluations.store');
    Route::patch('/evaluations/{evaluation}', [EvaluationController::class, 'update'])->name('evaluations.update');
    Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->name('evaluations.destroy');

    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('/documents/create', [DocumentController::class, 'create'])->name('documents.create');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::patch('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export/company', [ReportController::class, 'exportCompany'])->name('reports.export.company');
    Route::get('/reports/export/course', [ReportController::class, 'exportCourse'])->name('reports.export.course');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:student'])->group(function () {
    Route::get('/placements/request', [PlacementController::class, 'request'])->name('placements.request');
    Route::post('/placements/request', [PlacementController::class, 'storeRequest'])->name('placements.request.store');
});

Route::middleware(['auth', 'verified', 'role:admin,coordinator'])->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
    Route::patch('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');

    Route::get('/companies/create', [CompanyController::class, 'create'])->name('companies.create');
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    Route::get('/companies/{company}/edit', [CompanyController::class, 'edit'])->name('companies.edit');
    Route::patch('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');

    Route::get('/supervisors', [SupervisorController::class, 'index'])->name('supervisors.index');
    Route::get('/supervisors/create', [SupervisorController::class, 'create'])->name('supervisors.create');
    Route::post('/supervisors', [SupervisorController::class, 'store'])->name('supervisors.store');
    Route::get('/supervisors/{supervisor}/edit', [SupervisorController::class, 'edit'])->name('supervisors.edit');
    Route::patch('/supervisors/{supervisor}', [SupervisorController::class, 'update'])->name('supervisors.update');
    Route::delete('/supervisors/{supervisor}', [SupervisorController::class, 'destroy'])->name('supervisors.destroy');

    Route::get('/placements/create', [PlacementController::class, 'create'])->name('placements.create');
    Route::post('/placements', [PlacementController::class, 'store'])->name('placements.store');
    Route::get('/placements/{placement}/edit', [PlacementController::class, 'edit'])->name('placements.edit');
    Route::patch('/placements/{placement}', [PlacementController::class, 'update'])->name('placements.update');
    Route::delete('/placements/{placement}', [PlacementController::class, 'destroy'])->name('placements.destroy');
    Route::patch('/placements/{placement}/approve', [PlacementController::class, 'approve'])->name('placements.approve');
    Route::patch('/placements/{placement}/activate', [PlacementController::class, 'activate'])->name('placements.activate');
    Route::patch('/placements/{placement}/complete', [PlacementController::class, 'complete'])->name('placements.complete');
    Route::patch('/placements/{placement}/cancel', [PlacementController::class, 'cancel'])->name('placements.cancel');

    Route::get('/batches', [OjtBatchController::class, 'index'])->name('batches.index');
    Route::get('/batches/create', [OjtBatchController::class, 'create'])->name('batches.create');
    Route::post('/batches', [OjtBatchController::class, 'store'])->name('batches.store');
    Route::get('/batches/{batch}/edit', [OjtBatchController::class, 'edit'])->name('batches.edit');
    Route::patch('/batches/{batch}', [OjtBatchController::class, 'update'])->name('batches.update');
    Route::delete('/batches/{batch}', [OjtBatchController::class, 'destroy'])->name('batches.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
});

require __DIR__.'/auth.php';
