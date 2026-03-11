<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->hasRole(UserRole::Admin)
            || $user->hasRole(UserRole::Coordinator)
            || $user->hasRole(UserRole::Adviser)
            || $user->hasRole(UserRole::Supervisor);
    }

    public function rules(): array
    {
        return [
            'evaluation_period' => ['nullable', 'string', 'in:midterm,final,periodic'],
            'criteria_json' => ['nullable', 'array'],
            'criteria_json.*' => ['numeric', 'min:0', 'max:100'],
            'overall_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'remarks' => ['nullable', 'string', 'min:3'],
            'evaluated_at' => ['nullable', 'date'],
        ];
    }
}
