<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Notification;
use App\Models\Placement;
use App\Models\User;

class NotificationService
{
    public function notifyUserIds(array $userIds, string $type, string $title, string $body, ?string $url = null, array $metadata = []): void
    {
        $uniqueIds = array_values(array_unique(array_filter($userIds, fn ($id) => ! empty($id))));

        if ($uniqueIds === []) {
            return;
        }

        $now = now();
        $rows = array_map(function ($userId) use ($type, $title, $body, $url, $metadata, $now) {
            return [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'url' => $url,
                'metadata_json' => json_encode($metadata),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $uniqueIds);

        Notification::insert($rows);
    }

    public function notifyPlacementReviewers(Placement $placement, string $type, string $title, string $body, ?string $url = null, array $metadata = []): void
    {
        $placement->loadMissing(['adviser.user', 'supervisor.user']);

        $userIds = [
            $placement->adviser?->user_id,
            $placement->supervisor?->user_id,
        ];

        $this->notifyUserIds($userIds, $type, $title, $body, $url, $metadata);
    }

    public function notifyAdminsAndCoordinators(string $type, string $title, string $body, ?string $url = null, array $metadata = []): void
    {
        $userIds = User::query()
            ->whereIn('role', [UserRole::Admin->value, UserRole::Coordinator->value])
            ->pluck('id')
            ->all();

        $this->notifyUserIds($userIds, $type, $title, $body, $url, $metadata);
    }

    public function notifyStudent(Placement $placement, string $type, string $title, string $body, ?string $url = null, array $metadata = []): void
    {
        $placement->loadMissing(['student.user']);

        $this->notifyUserIds(
            [$placement->student?->user_id],
            $type,
            $title,
            $body,
            $url,
            $metadata
        );
    }
}
