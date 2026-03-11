<?php

namespace Database\Factories;

use App\Models\Placement;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceLogFactory extends Factory
{
    public function definition(): array
    {
        $timeIn = now()->setTime(8, fake()->numberBetween(0, 30));
        $timeOut = (clone $timeIn)->addHours(fake()->numberBetween(6, 9));

        return [
            'placement_id' => Placement::factory(),
            'work_date' => now()->toDateString(),
            'time_in' => $timeIn,
            'time_out' => $timeOut,
            'total_minutes' => $timeIn->diffInMinutes($timeOut),
            'status' => fake()->randomElement(['pending', 'approved']),
            'remarks' => null,
        ];
    }
}
