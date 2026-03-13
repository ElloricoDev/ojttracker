<?php

namespace App\Http\Resources\Api\V1;

use App\Models\WeeklyReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WeeklyReport */
class WeeklyReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'placement_id' => $this->placement_id,
            'week_start' => $this->week_start?->toDateString(),
            'week_end' => $this->week_end?->toDateString(),
            'accomplishments' => $this->accomplishments,
            'hours_rendered' => (float) $this->hours_rendered,
            'status' => $this->status,
            'reviewer_id' => $this->reviewer_id,
            'reviewer_comment' => $this->reviewer_comment,
            'reviewer' => $this->reviewer ? [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
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
