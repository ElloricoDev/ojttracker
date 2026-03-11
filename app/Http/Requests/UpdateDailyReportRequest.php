<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDailyReportRequest extends FormRequest
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
            'status' => ['required', 'string', 'in:submitted,reviewed,rejected'],
            'reviewer_comment' => ['nullable', 'string', 'max:500'],
        ];
    }
}
