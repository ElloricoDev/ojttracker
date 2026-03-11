<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class StoreSupervisorRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->hasRole(UserRole::Admin) || $user->hasRole(UserRole::Coordinator);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'company_id' => ['required', 'exists:companies,id'],
            'position' => ['nullable', 'string', 'max:120'],
            'contact_no' => ['nullable', 'string', 'max:50'],
        ];
    }
}
