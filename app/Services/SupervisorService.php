<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Supervisor;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SupervisorService
{
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function create(array $payload, ?User $actor = null): Supervisor
    {
        return DB::transaction(function () use ($payload, $actor) {
            $user = User::create([
                'name' => $payload['name'],
                'email' => $payload['email'],
                'password' => $payload['password'],
                'role' => UserRole::Supervisor,
            ]);

            $supervisor = Supervisor::create([
                'user_id' => $user->id,
                'company_id' => $payload['company_id'],
                'position' => $payload['position'] ?? null,
                'contact_no' => $payload['contact_no'] ?? null,
            ]);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'supervisor.created',
                    Supervisor::class,
                    $supervisor->id,
                    ['company_id' => $supervisor->company_id]
                );
            }

            return $supervisor;
        });
    }

    public function update(Supervisor $supervisor, array $payload, ?User $actor = null): Supervisor
    {
        return DB::transaction(function () use ($supervisor, $payload, $actor) {
            $user = $supervisor->user;

            $userAttributes = [
                'name' => $payload['name'],
                'email' => $payload['email'],
            ];

            if (! empty($payload['password'])) {
                $userAttributes['password'] = $payload['password'];
            }

            $user?->update($userAttributes);

            $supervisor->update([
                'company_id' => $payload['company_id'],
                'position' => $payload['position'] ?? null,
                'contact_no' => $payload['contact_no'] ?? null,
            ]);

            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'supervisor.updated',
                    Supervisor::class,
                    $supervisor->id,
                    ['company_id' => $supervisor->company_id]
                );
            }

            return $supervisor->refresh();
        });
    }

    public function delete(Supervisor $supervisor, ?User $actor = null): void
    {
        DB::transaction(function () use ($supervisor, $actor) {
            if ($actor) {
                $this->auditLogService->log(
                    $actor,
                    'supervisor.deleted',
                    Supervisor::class,
                    $supervisor->id,
                    ['company_id' => $supervisor->company_id]
                );
            }

            $user = $supervisor->user;
            $supervisor->delete();
            $user?->delete();
        });
    }
}
