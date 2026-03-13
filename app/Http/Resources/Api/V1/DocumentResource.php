<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Document */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'placement_id' => $this->placement_id,
            'document_type' => $this->document_type,
            'file_name' => $this->file_path ? basename($this->file_path) : null,
            'file_path' => $this->file_path,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'verified_at' => $this->verified_at?->toIso8601String(),
            'verified_by' => $this->verified_by,
            'verifier' => $this->verifier ? [
                'id' => $this->verifier->id,
                'name' => $this->verifier->name,
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
