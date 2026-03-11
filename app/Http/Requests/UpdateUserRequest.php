<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        $role = $this->input('role');
        $userId = $this->route('user')?->id ?? null;

        $allowedRoles = [UserRole::Admin->value, UserRole::Coordinator->value, UserRole::Adviser->value];

        if ($this->user()?->hasRole(UserRole::Coordinator)) {
            $allowedRoles = array_values(array_diff($allowedRoles, [UserRole::Admin->value]));
        }

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in($allowedRoles)],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'department' => $role === UserRole::Adviser->value ? ['required', 'string', 'max:120'] : ['nullable', 'string', 'max:120'],
        ];
    }
}
