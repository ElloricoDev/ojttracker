<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
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
        $student = $this->route('student');

        return [
            'student_no' => [
                'required',
                'string',
                'max:50',
                Rule::unique('students', 'student_no')->ignore($student?->id),
            ],
            'course' => ['required', 'string', 'max:100'],
            'year_level' => ['required', 'integer', 'min:1', 'max:6'],
            'required_hours' => ['required', 'integer', 'min:1', 'max:10000'],
            'ojt_batch_id' => ['nullable', 'exists:ojt_batches,id'],
            'contact_no' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_no' => ['nullable', 'string', 'max:50'],
        ];
    }
}
