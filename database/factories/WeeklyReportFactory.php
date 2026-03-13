<?php

namespace Database\Factories;

use App\Models\Placement;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class WeeklyReportFactory extends Factory
{
    public function definition(): array
    {
        $start = Carbon::instance(fake()->dateTimeBetween('-8 weeks', '-1 week'))->startOfWeek();
        $end = (clone $start)->endOfWeek();

        return [
            'placement_id' => Placement::factory(),
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'accomplishments' => fake()->paragraph(),
            'hours_rendered' => fake()->randomFloat(2, 20, 60),
            'status' => fake()->randomElement(['submitted', 'reviewed']),
            'reviewer_comment' => null,
        ];
    }
}
