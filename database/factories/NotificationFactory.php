<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['reminder', 'system', 'approval', 'alert']),
            'title' => fake()->sentence(4),
            'body' => fake()->paragraph(),
            'url' => fake()->boolean(30) ? fake()->url() : null,
            'metadata_json' => [
                'source' => fake()->randomElement(['system', 'coordinator', 'supervisor']),
                'priority' => fake()->randomElement(['low', 'normal', 'high']),
            ],
            'read_at' => fake()->boolean(40) ? now()->subDays(fake()->numberBetween(1, 7)) : null,
        ];
    }
}
