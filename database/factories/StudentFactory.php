<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => UserRole::Student]),
            'student_no' => '2026-'.fake()->unique()->numerify('#####'),
            'course' => fake()->randomElement(['BSIT', 'BSCS', 'BSIS']),
            'year_level' => fake()->numberBetween(3, 4),
            'required_hours' => fake()->randomElement([486, 520, 600]),
            'contact_no' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_no' => fake()->phoneNumber(),
        ];
    }
}
