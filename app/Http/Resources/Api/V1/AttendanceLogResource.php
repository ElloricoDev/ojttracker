<?php

namespace App\Http\Resources\Api\V1;

use App\Models\AttendanceLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AttendanceLog */
class AttendanceLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'placement_id' => $this->placement_id,
            'work_date' => $this->work_date?->toDateString(),
            'time_in' => $this->time_in?->toIso8601String(),
            'time_out' => $this->time_out?->toIso8601String(),
            'total_minutes' => $this->total_minutes,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'remarks' => $this->remarks,
            'approver' => $this->approver ? [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ] : null,
            'placement' => $this->placement ? [
                'id' => $this->placement->id,
                'status' => $this->placement->status,
                'start_date' => $this->placement->start_date?->toDateString(),
                'end_date' => $this->placement->end_date?->toDateString(),
                'company' => $this->placement->company ? [
                    'id' => $this->placement->company->id,
                    'name' => $this->placement->company->name,
                ] : null,
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
