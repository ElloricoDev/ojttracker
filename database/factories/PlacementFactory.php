<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Adviser;
use App\Models\Company;
use App\Models\OjtBatch;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlacementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'company_id' => Company::factory(),
            'supervisor_id' => Supervisor::factory(),
            'adviser_id' => Adviser::factory(),
            'ojt_batch_id' => OjtBatch::factory(),
            'required_hours' => fake()->randomElement([300, 486, 600]),
            'start_date' => now()->subWeeks(2),
            'end_date' => now()->addMonths(4),
            'status' => fake()->randomElement(['pending', 'approved', 'active']),
            'created_by' => User::factory()->state(['role' => UserRole::Coordinator]),
        ];
    }
}
