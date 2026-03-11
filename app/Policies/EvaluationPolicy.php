<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Evaluation;
use App\Models\User;

class EvaluationPolicy
{
    public function delete(User $user, Evaluation $evaluation): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return true;
        }

        return $evaluation->evaluator_id === $user->id;
    }
}
