<?php

namespace App\Services;

use App\Models\Placement;
use App\Models\User;
use App\Repositories\Contracts\PlacementRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlacementService
{
    public function __construct(
        private readonly PlacementRepositoryInterface $placementRepository,
        private readonly AuditLogService $auditLogService,
        private readonly NotificationService $notificationService,
    )
    {
    }

    public function create(array $attributes, ?int $createdBy = null, ?User $actor = null): Placement
    {
        return DB::transaction(function () use ($attributes, $createdBy, $actor) {
            $attributes['created_by'] = $createdBy;

            $placement = $this->placementRepository->create($attributes);

            $this->auditLogService->log(
                $actor,
                'placement.created',
                Placement::class,
                $placement->id,
                ['status' => $placement->status]
            );

            $this->notificationService->notifyAdminsAndCoordinators(
                'placement.created',
                'Placement pending approval',
                'A new placement was created and requires review.',
                route('placements.index'),
                ['placement_id' => $placement->id]
            );

            return $placement;
        });
    }

    public function update(Placement $placement, array $attributes, ?User $actor = null): Placement
    {
        return DB::transaction(function () use ($placement, $attributes, $actor) {
            if (array_key_exists('status', $attributes) && $attributes['status'] !== $placement->status) {
                $this->assertTransition($placement->status, $attributes['status']);
            }

            $updated = $this->placementRepository->update($placement, $attributes);

            $this->auditLogService->log(
                $actor,
                'placement.updated',
                Placement::class,
                $updated->id,
                ['status' => $updated->status]
            );

            return $updated;
        });
    }

    public function approve(Placement $placement, ?User $actor = null): Placement
    {
        return $this->changeStatus($placement, 'approved', $actor);
    }

    public function activate(Placement $placement, ?User $actor = null): Placement
    {
        return $this->changeStatus($placement, 'active', $actor);
    }

    public function complete(Placement $placement, ?User $actor = null): Placement
    {
        return $this->changeStatus($placement, 'completed', $actor);
    }

    public function cancel(Placement $placement, ?User $actor = null): Placement
    {
        return $this->changeStatus($placement, 'cancelled', $actor);
    }

    public function delete(Placement $placement, ?User $actor = null): void
    {
        DB::transaction(function () use ($placement, $actor) {
            $this->auditLogService->log(
                $actor,
                'placement.deleted',
                Placement::class,
                $placement->id,
                ['status' => $placement->status]
            );

            $this->placementRepository->delete($placement);
        });
    }

    private function changeStatus(Placement $placement, string $nextStatus, ?User $actor = null): Placement
    {
        $current = $placement->status;

        if ($current === $nextStatus) {
            return $placement;
        }

        $this->assertTransition($current, $nextStatus);

        return DB::transaction(function () use ($placement, $nextStatus, $actor, $current) {
            $attributes = ['status' => $nextStatus];

            if ($nextStatus === 'completed' && ! $placement->end_date) {
                $attributes['end_date'] = now()->toDateString();
            }

            $updated = $this->placementRepository->update($placement, $attributes);

            $this->auditLogService->log(
                $actor,
                'placement.status_changed',
                Placement::class,
                $updated->id,
                ['from' => $current, 'to' => $nextStatus]
            );

            $this->notificationService->notifyStudent(
                $updated,
                'placement.status_changed',
                'Placement status updated',
                "Your placement status is now {$nextStatus}.",
                route('placements.index'),
                ['placement_id' => $updated->id, 'status' => $nextStatus]
            );

            return $updated;
        });
    }

    private function assertTransition(string $current, string $nextStatus): void
    {
        $allowed = [
            'pending' => ['approved', 'cancelled'],
            'approved' => ['active', 'cancelled'],
            'active' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => [],
        ];

        if (! in_array($nextStatus, $allowed[$current] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => "Cannot change status from {$current} to {$nextStatus}.",
            ]);
        }
    }
}
