<?php

namespace Database\Factories;

use App\Models\Placement;
use Illuminate\Database\Eloquent\Factories\Factory;

class DailyReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'placement_id' => Placement::factory(),
            'work_date' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'accomplishments' => fake()->paragraph(),
            'hours_rendered' => fake()->randomFloat(2, 2, 10),
            'status' => fake()->randomElement(['submitted', 'reviewed']),
            'reviewer_comment' => null,
        ];
    }
}
