<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Resources\Api\V1\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends StudentApiController
{
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $this->studentUser($request);
        $search = $request->string('search')->toString();
        $sort = $request->string('sort')->toString() ?: 'created_at';
        $allowedSorts = ['created_at', 'read_at'];
        $sortColumn = in_array($sort, $allowedSorts, true) ? $sort : 'created_at';
        $sortDirection = $this->direction($request);

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('type', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('body', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($this->perPage($request))
            ->withQueryString();

        return $this->paginatedResponse($notifications, NotificationResource::class);
    }

    public function unread(Request $request): JsonResponse
    {
        $user = $this->studentUser($request);
        $limit = (int) $request->integer('limit', 10);
        $limit = max(1, min(50, $limit));

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $notifications
                ->map(fn (Notification $notification) => (new NotificationResource($notification))->resolve($request))
                ->values(),
        ]);
    }

    public function markRead(Request $request, int $notification): JsonResponse
    {
        $user = $this->studentUser($request);
        $record = Notification::query()
            ->where('user_id', $user->id)
            ->whereKey($notification)
            ->firstOrFail();

        if ($record->read_at === null) {
            $record->forceFill(['read_at' => now()])->save();

            $this->auditLogService->log(
                $user,
                'notification.read',
                Notification::class,
                $record->id
            );
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => new NotificationResource($record->fresh()),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $this->studentUser($request);
        $readAt = now();

        $updatedCount = Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => $readAt]);

        if ($updatedCount > 0) {
            $this->auditLogService->log(
                $user,
                'notification.read_all',
                User::class,
                $user->id,
                ['updated_count' => $updatedCount]
            );
        }

        return response()->json([
            'message' => 'All unread notifications have been marked as read.',
            'data' => [
                'updated_count' => $updatedCount,
                'read_at' => $readAt->toIso8601String(),
            ],
        ]);
    }

}
