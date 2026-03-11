<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AttendanceLog;
use App\Models\User;

class AttendanceLogPolicy
{
    public function approve(User $user, AttendanceLog $attendanceLog): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return true;
        }

        $placement = $attendanceLog->placement;

        if ($role === UserRole::Adviser->value && $user->adviserProfile) {
            return $placement && $placement->adviser_id === $user->adviserProfile->id;
        }

        if ($role === UserRole::Supervisor->value && $user->supervisorProfile) {
            return $placement && $placement->supervisor_id === $user->supervisorProfile->id;
        }

        return false;
    }
}
