<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Notification;
use App\Models\User;

class NotificationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Notification $notification): bool
    {
        return $notification->user_id === $user->id;
    }

    public function update(User $user, Notification $notification): bool
    {
        return $notification->user_id === $user->id;
    }

    public function delete(User $user, Notification $notification): bool
    {
        return $notification->user_id === $user->id || $this->isAdmin($user);
    }

    private function isAdmin(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return $role === UserRole::Admin->value;
    }
}
