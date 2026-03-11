<?php

use App\Enums\UserRole;
use App\Models\Adviser;
use App\Models\Company;
use App\Models\OjtBatch;
use App\Models\Placement;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\User;
use Carbon\Carbon;

it('logs time in and time out for a placement', function () {
    $user = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);

    $student = Student::factory()->create([
        'user_id' => $user->id,
    ]);

    $placement = Placement::factory()->create([
        'student_id' => $student->id,
        'company_id' => Company::factory()->create()->id,
        'supervisor_id' => Supervisor::factory()->create()->id,
        'adviser_id' => Adviser::factory()->create()->id,
        'ojt_batch_id' => OjtBatch::factory()->create()->id,
        'status' => 'active',
    ]);

    $timeIn = Carbon::parse('2026-03-10 08:00:00');
    $timeOut = Carbon::parse('2026-03-10 17:00:00');

    $this->actingAs($user)
        ->post(route('attendance.time-in'), [
            'placement_id' => $placement->id,
            'timestamp' => $timeIn->toIso8601String(),
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('attendance.time-out'), [
            'placement_id' => $placement->id,
            'timestamp' => $timeOut->toIso8601String(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('attendance_logs', [
        'placement_id' => $placement->id,
        'total_minutes' => 540,
    ]);
});
