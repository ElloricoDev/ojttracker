<?php

namespace Database\Factories;

use App\Models\Placement;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'placement_id' => Placement::factory(),
            'document_type' => fake()->randomElement(['moa', 'waiver', 'report']),
            'file_path' => 'documents/'.fake()->uuid().'.pdf',
            'submitted_at' => now(),
            'status' => fake()->randomElement(['pending', 'verified']),
        ];
    }
}
