<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupervisorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => UserRole::Supervisor]),
            'company_id' => Company::factory(),
            'position' => fake()->jobTitle(),
            'contact_no' => fake()->phoneNumber(),
        ];
    }
}
