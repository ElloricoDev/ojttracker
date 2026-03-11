<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Document $document): bool
    {
        $role = $user->role?->value ?? (string) $user->role;
        $placement = $document->placement;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return true;
        }

        if ($role === UserRole::Adviser->value && $user->adviserProfile) {
            return $placement && $placement->adviser_id === $user->adviserProfile->id;
        }

        if ($role === UserRole::Supervisor->value && $user->supervisorProfile) {
            return $placement && $placement->supervisor_id === $user->supervisorProfile->id;
        }

        if ($role === UserRole::Student->value && $user->studentProfile) {
            return $placement && $placement->student_id === $user->studentProfile->id;
        }

        return false;
    }

    public function verify(User $user, Document $document): bool
    {
        $role = $user->role?->value ?? (string) $user->role;

        if (in_array($role, [UserRole::Admin->value, UserRole::Coordinator->value], true)) {
            return true;
        }

        $placement = $document->placement;

        if ($role === UserRole::Adviser->value && $user->adviserProfile) {
            return $placement && $placement->adviser_id === $user->adviserProfile->id;
        }

        if ($role === UserRole::Supervisor->value && $user->supervisorProfile) {
            return $placement && $placement->supervisor_id === $user->supervisorProfile->id;
        }

        return false;
    }

    public function delete(User $user, Document $document): bool
    {
        return $this->verify($user, $document);
    }
}
