<?php

namespace Database\Factories;

use App\Models\Placement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'placement_id' => Placement::factory(),
            'evaluator_type' => fake()->randomElement(['adviser', 'supervisor']),
            'evaluation_period' => fake()->randomElement(['midterm', 'final', 'periodic']),
            'evaluator_id' => User::factory(),
            'criteria_json' => ['attendance' => fake()->numberBetween(70, 100)],
            'overall_score' => fake()->randomFloat(2, 70, 100),
            'remarks' => fake()->sentence(),
            'evaluated_at' => now(),
        ];
    }
}
