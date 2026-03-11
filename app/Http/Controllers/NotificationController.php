<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Notification::class);
        $user = request()->user();
        $search = request('search');
        $perPage = (int) request('per_page', 10);
        $sort = request('sort', 'created_at');
        $direction = request('direction', 'desc');
        $allowedSorts = ['created_at', 'read_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'asc' ? 'asc' : 'desc';

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->when($search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('body', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Notification $notification) => [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'body' => $notification->body,
                'url' => $notification->url,
                'metadata' => $notification->metadata_json,
                'read_at' => $notification->read_at?->toDateTimeString(),
                'created_at' => $notification->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortColumn,
                'direction' => $sortDirection,
            ],
        ]);
    }

    public function markRead(Notification $notification): RedirectResponse
    {
        $this->authorize('update', $notification);
        $this->assertOwner($notification);

        $notification->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        $this->authorize('viewAny', Notification::class);
        $user = request()->user();

        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back();
    }

    public function unread(): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);
        $user = request()->user();

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->latest()
            ->limit(10)
            ->get(['id', 'type', 'title', 'body', 'created_at']);

        return response()->json([
            'data' => $notifications,
        ]);
    }

    private function assertOwner(Notification $notification): void
    {
        $user = request()->user();

        if (! $user || $notification->user_id !== $user->id) {
            abort(403);
        }
    }
}
