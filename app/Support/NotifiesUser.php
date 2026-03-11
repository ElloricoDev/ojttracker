<?php

namespace App\Support;

use App\Services\NotificationService;

trait NotifiesUser
{
    protected function toast(?int $userId, string $title, string $body, string $type = 'success'): void
    {
        if (! $userId) {
            return;
        }

        app(NotificationService::class)->notifyUserIds([$userId], $type, $title, $body);
    }
}
