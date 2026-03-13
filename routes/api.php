<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Student\AttendanceController as StudentAttendanceController;
use App\Http\Controllers\Api\V1\Student\DailyReportController as StudentDailyReportController;
use App\Http\Controllers\Api\V1\Student\DocumentController as StudentDocumentController;
use App\Http\Controllers\Api\V1\Student\NotificationController as StudentNotificationController;
use App\Http\Controllers\Api\V1\Student\PlacementController as StudentPlacementController;
use App\Http\Controllers\Api\V1\Student\WeeklyReportController as StudentWeeklyReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:mobile-auth-login');

        Route::middleware(['auth:sanctum', 'active'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::prefix('student')
        ->middleware(['auth:sanctum', 'active', 'role:student'])
        ->group(function () {
            Route::get('placement', [StudentPlacementController::class, 'show']);
            Route::post('placement/request', [StudentPlacementController::class, 'storeRequest'])
                ->middleware('throttle:mobile-placement-request');

            Route::get('attendance', [StudentAttendanceController::class, 'index']);
            Route::post('attendance/time-in', [StudentAttendanceController::class, 'timeIn'])
                ->middleware('throttle:mobile-attendance-mutation');
            Route::post('attendance/time-out', [StudentAttendanceController::class, 'timeOut'])
                ->middleware('throttle:mobile-attendance-mutation');

            Route::get('daily-reports', [StudentDailyReportController::class, 'index']);
            Route::post('daily-reports', [StudentDailyReportController::class, 'store'])
                ->middleware('throttle:mobile-report-submission');

            Route::get('weekly-reports', [StudentWeeklyReportController::class, 'index']);
            Route::post('weekly-reports', [StudentWeeklyReportController::class, 'store'])
                ->middleware('throttle:mobile-report-submission');

            Route::get('documents', [StudentDocumentController::class, 'index']);
            Route::post('documents', [StudentDocumentController::class, 'store'])
                ->middleware('throttle:mobile-document-submission');

            Route::get('notifications', [StudentNotificationController::class, 'index']);
            Route::get('notifications/unread', [StudentNotificationController::class, 'unread']);
            Route::patch('notifications/read-all', [StudentNotificationController::class, 'markAllRead'])
                ->middleware('throttle:mobile-notification-mutation');
            Route::patch('notifications/{notification}/read', [StudentNotificationController::class, 'markRead'])
                ->middleware('throttle:mobile-notification-mutation');
        });
});
