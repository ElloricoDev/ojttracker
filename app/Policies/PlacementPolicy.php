<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Placement;
use App\Models\User;

class PlacementPolicy
{
    public function view(User $user, Placement $placement): bool
    {
        return $this->isAdminOrCoordinator($user)
            || $this->isAdviserForPlacement($user, $placement)
            || $this->isSupervisorForPlacement($user, $placement)
            || $this->isStudentForPlacement($user, $placement);
    }

    public function manage(User $user): bool
    {
        return $this->isAdminOrCoordinator($user);
    }

    public function logAttendance(User $user, Placement $placement): bool
    {
        return $this->isAdminOrCoordinator($user)
            || $this->isStudentForPlacement($user, $placement);
    }

    public function submitDailyReport(User $user, Placement $placement): bool
    {
        return $this->isAdminOrCoordinator($user)
            || $this->isStudentForPlacement($user, $placement);
    }

    public function submitWeeklyReport(User $user, Placement $placement): bool
    {
        return $this->submitDailyReport($user, $placement);
    }

    public function reviewDailyReport(User $user, Placement $placement): bool
    {
        return $this->isAdminOrCoordinator($user)
            || $this->isAdviserForPlacement($user, $placement)
            || $this->isSupervisorForPlacement($user, $placement);
    }

    public function reviewWeeklyReport(User $user, Placement $placement): bool
    {
        return $this->reviewDailyReport($user, $placement);
    }

    public function uploadDocument(User $user, Placement $placement): bool
    {
        return $this->submitDailyReport($user, $placement);
    }

    public function verifyDocument(User $user, Placement $placement): bool
    {
        return $this->reviewDailyReport($user, $placement);
    }

    public function createEvaluation(User $user, Placement $placement): bool
    {
        return $this->reviewDailyReport($user, $placement);
    }

    private function isAdminOrCoordinator(User $user): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        return in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true);
    }

    private function isStudentForPlacement(User $user, Placement $placement): bool
    {
        return $user->studentProfile && $placement->student_id === $user->studentProfile->id;
    }

    private function isAdviserForPlacement(User $user, Placement $placement): bool
    {
        return $user->adviserProfile && $placement->adviser_id === $user->adviserProfile->id;
    }

    private function isSupervisorForPlacement(User $user, Placement $placement): bool
    {
        return $user->supervisorProfile && $placement->supervisor_id === $user->supervisorProfile->id;
    }
}
