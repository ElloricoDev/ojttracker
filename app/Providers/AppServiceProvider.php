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
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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
        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        $requestFingerprint = static fn (Request $request): string => (string) ($request->user()?->id ?? $request->ip());

        RateLimiter::for('mobile-auth-login', function (Request $request) {
            $email = strtolower((string) $request->input('email', 'guest'));

            return Limit::perMinute(6)->by($email.'|'.$request->ip());
        });

        RateLimiter::for(
            'mobile-placement-request',
            fn (Request $request) => Limit::perMinute(4)->by('placement|'.$requestFingerprint($request))
        );

        RateLimiter::for(
            'mobile-attendance-mutation',
            fn (Request $request) => Limit::perMinute(12)->by('attendance|'.$requestFingerprint($request))
        );

        RateLimiter::for(
            'mobile-report-submission',
            fn (Request $request) => Limit::perMinute(10)->by('report|'.$requestFingerprint($request))
        );

        RateLimiter::for(
            'mobile-document-submission',
            fn (Request $request) => Limit::perMinute(6)->by('document|'.$requestFingerprint($request))
        );

        RateLimiter::for(
            'mobile-notification-mutation',
            fn (Request $request) => Limit::perMinute(30)->by('notification|'.$requestFingerprint($request))
        );
    }
}
