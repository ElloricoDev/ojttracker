<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class OjtBatchFactory extends Factory
{
    public function definition(): array
    {
        $year = fake()->numberBetween(2024, 2027);

        return [
            'name' => "SY {$year}-".($year + 1).' - '.fake()->randomElement(['1st Sem', '2nd Sem']),
            'school_year' => "{$year}-".($year + 1),
            'semester' => fake()->randomElement(['1st', '2nd']),
            'start_date' => now()->subMonth(),
            'end_date' => now()->addMonths(4),
        ];
    }
}
