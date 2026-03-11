<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function view(User $user, User $model): bool
    {
        return $this->isAdminOrCoordinator($user) && $this->isManageableRole($model);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function update(User $user, User $model): bool
    {
        if (! $this->isAdminOrCoordinator($user) || ! $this->isManageableRole($model)) {
            return false;
        }

        return $this->isAdmin($user) || ! $this->isAdmin($model);
    }

    public function delete(User $user, User $model): bool
    {
        if (! $this->isAdminOrCoordinator($user) || ! $this->isManageableRole($model) || $user->id === $model->id) {
            return false;
        }

        return $this->isAdmin($user) || ! $this->isAdmin($model);
    }

    private function isAdminOrCoordinator(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
    }

    private function isAdmin(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return $role === UserRole::Admin->value;
    }

    private function isManageableRole(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value], true);
    }
}
