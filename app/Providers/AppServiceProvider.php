<?php

namespace App\Providers;

use App\Repositories\Contracts\AttendanceLogRepositoryInterface;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\DailyReportRepositoryInterface;
use App\Repositories\Contracts\WeeklyReportRepositoryInterface;
use App\Repositories\Contracts\EvaluationRepositoryInterface;
use App\Repositories\Contracts\PlacementRepositoryInterface;
use App\Repositories\Eloquent\AttendanceLogRepository;
use App\Repositories\Eloquent\DocumentRepository;
use App\Repositories\Eloquent\DailyReportRepository;
use App\Repositories\Eloquent\WeeklyReportRepository;
use App\Repositories\Eloquent\EvaluationRepository;
use App\Repositories\Eloquent\PlacementRepository;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PlacementRepositoryInterface::class, PlacementRepository::class);
        $this->app->bind(AttendanceLogRepositoryInterface::class, AttendanceLogRepository::class);
        $this->app->bind(DailyReportRepositoryInterface::class, DailyReportRepository::class);
        $this->app->bind(WeeklyReportRepositoryInterface::class, WeeklyReportRepository::class);
        $this->app->bind(EvaluationRepositoryInterface::class, EvaluationRepository::class);
        $this->app->bind(DocumentRepositoryInterface::class, DocumentRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
