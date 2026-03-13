<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\EnsureActiveUser::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
            'active' => \App\Http\Middleware\EnsureActiveUser::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $isApiRequest = static fn (Request $request): bool => $request->is('api/*');

        $apiError = static function (string $message, string $type, int $status, array $extra = []): JsonResponse {
            return response()->json(array_merge([
                'message' => $message,
                'error' => [
                    'type' => $type,
                    'status' => $status,
                ],
            ], $extra), $status);
        };

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, Throwable $exception): bool => $isApiRequest($request)
        );

        $exceptions->render(function (AuthenticationException $exception, Request $request) use ($apiError, $isApiRequest): ?JsonResponse {
            if (! $isApiRequest($request)) {
                return null;
            }

            return $apiError('Unauthenticated.', 'unauthenticated', 401);
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) use ($apiError, $isApiRequest): ?JsonResponse {
            if (! $isApiRequest($request)) {
                return null;
            }

            return $apiError(
                $exception->getMessage() ?: 'You are not authorized to perform this action.',
                'forbidden',
                403
            );
        });

        $exceptions->render(function (ValidationException $exception, Request $request) use ($apiError, $isApiRequest): ?JsonResponse {
            if (! $isApiRequest($request)) {
                return null;
            }

            return $apiError(
                $exception->getMessage(),
                'validation_error',
                422,
                ['errors' => $exception->errors()]
            );
        });

        $exceptions->render(function (ModelNotFoundException $exception, Request $request) use ($apiError, $isApiRequest): ?JsonResponse {
            if (! $isApiRequest($request)) {
                return null;
            }

            return $apiError('Resource not found.', 'not_found', 404);
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) use ($apiError, $isApiRequest): ?JsonResponse {
            if (! $isApiRequest($request)) {
                return null;
            }

            return match ($exception->getStatusCode()) {
                401 => $apiError('Unauthenticated.', 'unauthenticated', 401),
                403 => $apiError($exception->getMessage() ?: 'Forbidden.', 'forbidden', 403),
                404 => $apiError('Resource not found.', 'not_found', 404),
                500 => $apiError('Server error.', 'server_error', 500),
                default => null,
            };
        });

        $exceptions->render(function (Throwable $exception, Request $request) use ($apiError, $isApiRequest): ?JsonResponse {
            if (! $isApiRequest($request) || $exception instanceof HttpExceptionInterface) {
                return null;
            }

            return $apiError('Server error.', 'server_error', 500);
        });
    })->create();
