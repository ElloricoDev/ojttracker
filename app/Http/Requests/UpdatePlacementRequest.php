<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(UserRole::Coordinator) || $this->user()?->hasRole(UserRole::Admin);
    }

    public function rules(): array
    {
        return [
            'company_id' => ['required', 'exists:companies,id'],
            'supervisor_id' => ['nullable', 'exists:supervisors,id'],
            'adviser_id' => ['nullable', 'exists:advisers,id'],
            'required_hours' => ['required', 'integer', 'min:1', 'max:2000'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['pending', 'approved', 'active', 'completed', 'cancelled'])],
        ];
    }
}
