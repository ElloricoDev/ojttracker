<?php

namespace App\Repositories\Eloquent;

use App\Models\AttendanceLog;
use App\Repositories\Contracts\AttendanceLogRepositoryInterface;

class AttendanceLogRepository implements AttendanceLogRepositoryInterface
{
    public function openForPlacement(int $placementId): ?AttendanceLog
    {
        return AttendanceLog::query()
            ->where('placement_id', $placementId)
            ->whereNull('time_out')
            ->latest('time_in')
            ->first();
    }

    public function create(array $attributes): AttendanceLog
    {
        return AttendanceLog::create($attributes);
    }

    public function update(AttendanceLog $attendanceLog, array $attributes): AttendanceLog
    {
        $attendanceLog->update($attributes);

        return $attendanceLog->refresh();
    }
}
