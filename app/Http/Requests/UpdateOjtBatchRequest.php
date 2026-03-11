<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOjtBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(UserRole::Admin)
            || $this->user()?->hasRole(UserRole::Coordinator);
    }

    public function rules(): array
    {
        $batchId = $this->route('batch')?->id ?? $this->route('ojt_batch')?->id;

        return [
            'name' => ['required', 'string', 'max:150', Rule::unique('ojt_batches', 'name')->ignore($batchId)],
            'school_year' => ['required', 'string', 'max:50'],
            'semester' => ['required', 'string', 'max:30'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ];
    }
}
