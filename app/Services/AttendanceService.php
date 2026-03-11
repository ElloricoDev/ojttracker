<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\User;
use App\Models\Placement;
use App\Repositories\Contracts\AttendanceLogRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    public function __construct(
        private readonly AttendanceLogRepositoryInterface $attendanceLogRepository,
        private readonly AuditLogService $auditLogService,
        private readonly NotificationService $notificationService,
    )
    {
    }

    public function timeIn(int $placementId, Carbon $timestamp, ?User $user = null): AttendanceLog
    {
        return DB::transaction(function () use ($placementId, $timestamp, $user) {
            $openLog = $this->attendanceLogRepository->openForPlacement($placementId);

            if ($openLog !== null) {
                throw ValidationException::withMessages([
                    'placement_id' => 'There is an active attendance session. Time out first.',
                ]);
            }

            $log = $this->attendanceLogRepository->create([
                'placement_id' => $placementId,
                'work_date' => $timestamp->toDateString(),
                'time_in' => $timestamp,
                'status' => 'pending',
            ]);

            if ($user) {
                $this->auditLogService->log(
                    $user,
                    'attendance.time_in',
                    AttendanceLog::class,
                    $log->id,
                    ['placement_id' => $placementId]
                );
            }

            return $log;
        });
    }

    public function timeOut(int $placementId, Carbon $timestamp, ?User $user = null): AttendanceLog
    {
        return DB::transaction(function () use ($placementId, $timestamp, $user) {
            $openLog = $this->attendanceLogRepository->openForPlacement($placementId);

            if ($openLog === null) {
                throw ValidationException::withMessages([
                    'placement_id' => 'No active attendance session found for time out.',
                ]);
            }

            $timeIn = Carbon::parse($openLog->time_in);

            if ($timestamp->lessThanOrEqualTo($timeIn)) {
                throw ValidationException::withMessages([
                    'time_out' => 'Time out must be later than time in.',
                ]);
            }

            $log = $this->attendanceLogRepository->update($openLog, [
                'time_out' => $timestamp,
                'total_minutes' => $timeIn->diffInMinutes($timestamp),
            ]);

            if ($user) {
                $this->auditLogService->log(
                    $user,
                    'attendance.time_out',
                    AttendanceLog::class,
                    $log->id,
                    ['placement_id' => $placementId]
                );
            }

            $placement = Placement::find($placementId);
            if ($placement) {
                $this->notificationService->notifyPlacementReviewers(
                    $placement,
                    'attendance.pending',
                    'Attendance pending approval',
                    'A time-out was logged and requires approval.',
                    route('attendance.index'),
                    ['attendance_log_id' => $log->id, 'placement_id' => $placementId]
                );
            }

            return $log;
        });
    }

    public function approve(AttendanceLog $attendanceLog, ?User $approver): AttendanceLog
    {
        if (! $approver) {
            throw ValidationException::withMessages([
                'approved_by' => 'Approver required.',
            ]);
        }

        $updated = $this->attendanceLogRepository->update($attendanceLog, [
            'status' => 'approved',
            'approved_by' => $approver->id,
            'remarks' => null,
        ]);

        $this->auditLogService->log(
            $approver,
            'attendance.approved',
            AttendanceLog::class,
            $updated->id,
            ['placement_id' => $updated->placement_id]
        );

        $placement = Placement::find($updated->placement_id);
        if ($placement) {
            $this->notificationService->notifyStudent(
                $placement,
                'attendance.approved',
                'Attendance approved',
                'Your attendance log was approved.',
                route('attendance.index'),
                ['attendance_log_id' => $updated->id]
            );
        }

        return $updated;
    }

    public function reject(AttendanceLog $attendanceLog, ?User $approver, ?string $remarks = null): AttendanceLog
    {
        if (! $approver) {
            throw ValidationException::withMessages([
                'approved_by' => 'Approver required.',
            ]);
        }

        $updated = $this->attendanceLogRepository->update($attendanceLog, [
            'status' => 'rejected',
            'approved_by' => $approver->id,
            'remarks' => $remarks,
        ]);

        $this->auditLogService->log(
            $approver,
            'attendance.rejected',
            AttendanceLog::class,
            $updated->id,
            ['placement_id' => $updated->placement_id]
        );

        $placement = Placement::find($updated->placement_id);
        if ($placement) {
            $this->notificationService->notifyStudent(
                $placement,
                'attendance.rejected',
                'Attendance rejected',
                'Your attendance log was rejected.',
                route('attendance.index'),
                ['attendance_log_id' => $updated->id]
            );
        }

        return $updated;
    }
}
