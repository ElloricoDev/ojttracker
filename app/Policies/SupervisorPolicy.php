<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Supervisor;
use App\Models\User;

class SupervisorPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function view(User $user, Supervisor $supervisor): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function update(User $user, Supervisor $supervisor): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function delete(User $user, Supervisor $supervisor): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    private function isAdminOrCoordinator(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
    }
}
