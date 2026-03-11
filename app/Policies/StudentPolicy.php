<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function view(User $user, Student $student): bool
    {
        return $this->isAdminOrCoordinator($user) || ($user->studentProfile && $student->id === $user->studentProfile->id);
    }

    public function create(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function update(User $user, Student $student): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function delete(User $user, Student $student): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    private function isAdminOrCoordinator(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
    }
}
