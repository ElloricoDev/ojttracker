<?php

namespace App\Repositories\Contracts;

use App\Models\AttendanceLog;

interface AttendanceLogRepositoryInterface
{
    public function openForPlacement(int $placementId): ?AttendanceLog;

    public function create(array $attributes): AttendanceLog;

    public function update(AttendanceLog $attendanceLog, array $attributes): AttendanceLog;
}
