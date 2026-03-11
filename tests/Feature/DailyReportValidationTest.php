<?php

use App\Enums\UserRole;
use App\Models\Placement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders daily reports page as inertia response', function () {
    $user = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);

    Placement::factory()->create();

    $response = $this->actingAs($user)->get(route('daily-reports.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('DailyReports/Index')
        ->has('placements')
    );
});

it('validates daily report payload', function () {
    $user = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('daily-reports.store'), [])
        ->assertSessionHasErrors([
            'placement_id',
            'work_date',
            'accomplishments',
            'hours_rendered',
        ]);
});
