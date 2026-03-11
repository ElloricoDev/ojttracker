<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class StorePlacementRequestForStudent extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(UserRole::Student) === true;
    }

    public function rules(): array
    {
        return [
            'company_id' => ['required', 'exists:companies,id'],
            'ojt_batch_id' => ['nullable', 'exists:ojt_batches,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }
}
