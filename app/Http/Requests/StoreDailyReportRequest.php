<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDailyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'placement_id' => ['required', 'exists:placements,id'],
            'work_date' => ['required', 'date'],
            'accomplishments' => ['required', 'string', 'min:10'],
            'hours_rendered' => ['required', 'numeric', 'min:0.25', 'max:24'],
        ];
    }
}
