<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\OjtBatch;
use App\Models\User;

class OjtBatchPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canManage($user);
    }

    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(User $user, OjtBatch $batch): bool
    {
        return $this->canManage($user);
    }

    public function delete(User $user, OjtBatch $batch): bool
    {
        return $this->canManage($user);
    }

    private function canManage(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
    }
}
