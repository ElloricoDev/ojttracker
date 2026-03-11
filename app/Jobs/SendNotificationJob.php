<?php

namespace App\Jobs;

use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param array<int> $userIds
     */
    public function __construct(
        public array $userIds,
        public string $type,
        public string $title,
        public string $body,
        public ?string $url = null,
        public array $metadata = [],
    ) {
    }

    public function handle(NotificationService $notificationService): void
    {
        $notificationService->notifyUserIds(
            $this->userIds,
            $this->type,
            $this->title,
            $this->body,
            $this->url,
            $this->metadata,
        );
    }
}
