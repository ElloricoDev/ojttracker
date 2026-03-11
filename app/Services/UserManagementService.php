<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Adviser;
use App\Models\Placement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserManagementService
{
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function create(array $payload, ?User $actor = null): User
    {
        return DB::transaction(function () use ($payload, $actor) {
            $this->ensureManageableRole($payload['role'] ?? null);
            $user = User::create([
                'name' => $payload['name'],
                'email' => $payload['email'],
                'password' => $payload['password'],
                'role' => $payload['role'],
                'status' => $payload['status'] ?? 'active',
            ]);

            $this->syncProfileForRole($user, $payload, null);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'user.created',
                    User::class,
                    $user->id,
                    ['role' => $payload['role']]
                );
            }

            return $user;
        });
    }

    public function update(User $user, array $payload, ?User $actor = null): User
    {
        return DB::transaction(function () use ($user, $payload, $actor) {
            $this->ensureManageableRole($payload['role'] ?? null);
            $roleBefore = $user->role?->value ?? (string) $user->role;

            $userAttributes = [
                'name' => $payload['name'],
                'email' => $payload['email'],
                'role' => $payload['role'],
                'status' => $payload['status'] ?? 'active',
            ];

            if (! empty($payload['password'])) {
                $userAttributes['password'] = $payload['password'];
            }

            $user->update($userAttributes);

            $this->syncProfileForRole($user, $payload, $roleBefore);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'user.updated',
                    User::class,
                    $user->id,
                    ['role' => $payload['role']]
                );
            }

            return $user->refresh();
        });
    }

    public function delete(User $user, ?User $actor = null): void
    {
        DB::transaction(function () use ($user, $actor) {
            $this->guardAgainstAssignedPlacements($user);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'user.deleted',
                    User::class,
                    $user->id,
                    ['role' => $user->role?->value ?? (string) $user->role]
                );
            }

            $user->studentProfile?->delete();
            $user->supervisorProfile?->delete();
            $user->adviserProfile?->delete();
            $user->delete();
        });
    }

    private function syncProfileForRole(User $user, array $payload, ?string $roleBefore): void
    {
        $role = $payload['role'] instanceof UserRole ? $payload['role']->value : (string) $payload['role'];

        if ($roleBefore && $roleBefore !== $role) {
            $this->guardAgainstAssignedPlacements($user);
            $user->adviserProfile?->delete();
        }

        if ($role === UserRole::Adviser->value) {
            $profile = $user->adviserProfile ?: new Adviser(['user_id' => $user->id]);
            $profile->fill([
                'department' => $payload['department'],
            ]);
            $profile->save();
        }
    }

    private function ensureManageableRole(mixed $role): void
    {
        $value = $role instanceof UserRole ? $role->value : (string) $role;

        if (! in_array($value, [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value], true)) {
            throw ValidationException::withMessages([
                'role' => 'Only admin, coordinator, or adviser roles can be managed here.',
            ]);
        }
    }

    private function guardAgainstAssignedPlacements(User $user): void
    {
        $role = $user->role?->value ?? (string) $user->role;

        if ($role === UserRole::Adviser->value && $user->adviserProfile) {
            $has = Placement::where('adviser_id', $user->adviserProfile->id)->exists();
            if ($has) {
                throw ValidationException::withMessages([
                    'role' => 'Cannot change or delete an adviser with existing placements.',
                ]);
            }
        }
    }
}
