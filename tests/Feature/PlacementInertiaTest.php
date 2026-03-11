<?php

use App\Enums\UserRole;
use App\Models\Adviser;
use App\Models\Company;
use App\Models\OjtBatch;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders placements index as inertia page', function () {
    $user = User::factory()->create([
        'role' => UserRole::Coordinator,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->get(route('placements.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Placements/Index')
        ->has('placements.data')
        ->has('filters')
    );
});

it('validates required fields when creating a placement', function () {
    $user = User::factory()->create([
        'role' => UserRole::Coordinator,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('placements.store'), [])
        ->assertSessionHasErrors([
            'student_id',
            'company_id',
            'ojt_batch_id',
            'required_hours',
            'start_date',
            'status',
        ]);
});

it('creates a placement for coordinator', function () {
    $user = User::factory()->create([
        'role' => UserRole::Coordinator,
        'email_verified_at' => now(),
    ]);

    $student = Student::factory()->create();
    $company = Company::factory()->create();
    $supervisor = Supervisor::factory()->create(['company_id' => $company->id]);
    $adviser = Adviser::factory()->create();
    $batch = OjtBatch::factory()->create();

    $payload = [
        'student_id' => $student->id,
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
        'adviser_id' => $adviser->id,
        'ojt_batch_id' => $batch->id,
        'required_hours' => 486,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonths(4)->toDateString(),
        'status' => 'active',
    ];

    $this->actingAs($user)
        ->post(route('placements.store'), $payload)
        ->assertRedirect(route('placements.index'));

    $this->assertDatabaseHas('placements', [
        'student_id' => $student->id,
        'company_id' => $company->id,
        'status' => 'active',
    ]);
});
