<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\Notification;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value ?? $user->role,
                ] : null,
            ],
            'notifications' => $user ? [
                'unread' => Notification::query()
                    ->where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get(['id', 'title', 'body', 'created_at']),
                'unreadCount' => Notification::query()
                    ->where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->count(),
            ] : [
                'unread' => [],
                'unreadCount' => 0,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
