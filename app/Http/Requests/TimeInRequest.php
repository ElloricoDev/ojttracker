<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TimeInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'placement_id' => ['required', 'exists:placements,id'],
            'timestamp' => ['nullable', 'date'],
        ];
    }
}
