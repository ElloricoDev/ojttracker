<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class ReportPolicy
{
    public function view(User $user): bool
    {
        $role = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
        $role = strtolower(trim($role));

        return in_array($role, [
            UserRole::Admin->value,
            UserRole::Coordinator->value,
            UserRole::Adviser->value,
            UserRole::Supervisor->value,
            UserRole::Student->value,
        ], true);
    }
}
