<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'action' => fake()->randomElement(['create', 'update', 'delete']),
            'entity_type' => fake()->randomElement(['placement', 'attendance', 'daily_report']),
            'entity_id' => fake()->numberBetween(1, 1000),
            'metadata_json' => ['source' => 'factory'],
        ];
    }
}
