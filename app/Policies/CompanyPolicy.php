<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function view(User $user, Company $company): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function update(User $user, Company $company): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function delete(User $user, Company $company): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    private function isAdminOrCoordinator(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
    }
}
