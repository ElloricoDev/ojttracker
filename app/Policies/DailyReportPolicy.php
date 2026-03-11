<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\DailyReport;
use App\Models\User;

class DailyReportPolicy
{
    public function review(User $user, DailyReport $dailyReport): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return true;
        }

        $placement = $dailyReport->placement;

        if ($role === UserRole::Adviser->value && $user->adviserProfile) {
            return $placement && $placement->adviser_id === $user->adviserProfile->id;
        }

        if ($role === UserRole::Supervisor->value && $user->supervisorProfile) {
            return $placement && $placement->supervisor_id === $user->supervisorProfile->id;
        }

        return false;
    }

    public function delete(User $user, DailyReport $dailyReport): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
    }
}
