<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AdviserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => UserRole::Adviser]),
            'department' => fake()->randomElement(['CCS', 'CBA', 'COE']),
        ];
    }
}
