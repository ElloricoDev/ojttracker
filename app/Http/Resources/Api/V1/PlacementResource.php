<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Placement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Placement */
class PlacementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'company_id' => $this->company_id,
            'supervisor_id' => $this->supervisor_id,
            'adviser_id' => $this->adviser_id,
            'ojt_batch_id' => $this->ojt_batch_id,
            'required_hours' => $this->required_hours,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status,
            'company' => $this->company ? [
                'id' => $this->company->id,
                'name' => $this->company->name,
                'address' => $this->company->address,
                'contact_person' => $this->company->contact_person,
                'email' => $this->company->email,
                'phone' => $this->company->phone,
            ] : null,
            'supervisor' => $this->supervisor?->user ? [
                'id' => $this->supervisor->id,
                'user_id' => $this->supervisor->user->id,
                'name' => $this->supervisor->user->name,
                'email' => $this->supervisor->user->email,
            ] : null,
            'adviser' => $this->adviser?->user ? [
                'id' => $this->adviser->id,
                'user_id' => $this->adviser->user->id,
                'name' => $this->adviser->user->name,
                'email' => $this->adviser->user->email,
            ] : null,
            'batch' => $this->batch ? [
                'id' => $this->batch->id,
                'name' => $this->batch->name,
                'school_year' => $this->batch->school_year,
                'semester' => $this->batch->semester,
                'start_date' => $this->batch->start_date?->toDateString(),
                'end_date' => $this->batch->end_date?->toDateString(),
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
