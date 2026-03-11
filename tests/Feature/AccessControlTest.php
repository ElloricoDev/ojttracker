<?php

use App\Enums\UserRole;
use App\Models\Adviser;
use App\Models\AttendanceLog;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\Document;
use App\Models\Evaluation;
use App\Models\OjtBatch;
use App\Models\Placement;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\User;

it('prevents students from approving attendance logs', function () {
    $user = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $student = Student::factory()->create(['user_id' => $user->id]);

    $placement = Placement::factory()->create([
        'student_id' => $student->id,
        'company_id' => Company::factory()->create()->id,
        'supervisor_id' => Supervisor::factory()->create()->id,
        'adviser_id' => Adviser::factory()->create()->id,
        'ojt_batch_id' => OjtBatch::factory()->create()->id,
        'status' => 'active',
    ]);

    $log = AttendanceLog::factory()->create([
        'placement_id' => $placement->id,
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->patch(route('attendance.approve', $log))
        ->assertForbidden();
});

it('prevents students from submitting reports for other placements', function () {
    $studentUser = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    Student::factory()->create(['user_id' => $studentUser->id]);

    $otherPlacement = Placement::factory()->create([
        'student_id' => Student::factory()->create()->id,
        'company_id' => Company::factory()->create()->id,
        'supervisor_id' => Supervisor::factory()->create()->id,
        'adviser_id' => Adviser::factory()->create()->id,
        'ojt_batch_id' => OjtBatch::factory()->create()->id,
        'status' => 'active',
    ]);

    $this->actingAs($studentUser)
        ->post(route('daily-reports.store'), [
            'placement_id' => $otherPlacement->id,
            'work_date' => now()->toDateString(),
            'accomplishments' => 'Completed assigned tasks.',
            'hours_rendered' => 8,
        ])
        ->assertForbidden();
});

it('allows advisers to review reports for assigned placements', function () {
    $adviserUser = User::factory()->create([
        'role' => UserRole::Adviser,
        'email_verified_at' => now(),
    ]);
    $adviser = Adviser::factory()->create(['user_id' => $adviserUser->id]);

    $placement = Placement::factory()->create([
        'adviser_id' => $adviser->id,
        'student_id' => Student::factory()->create()->id,
        'company_id' => Company::factory()->create()->id,
        'supervisor_id' => Supervisor::factory()->create()->id,
        'ojt_batch_id' => OjtBatch::factory()->create()->id,
        'status' => 'active',
    ]);

    $report = DailyReport::factory()->create([
        'placement_id' => $placement->id,
        'status' => 'submitted',
    ]);

    $this->actingAs($adviserUser)
        ->patch(route('daily-reports.update', $report), [
            'status' => 'reviewed',
            'reviewer_comment' => 'Looks good.',
        ])
        ->assertRedirect();
});

it('allows supervisors to verify documents for assigned placements', function () {
    $supervisorUser = User::factory()->create([
        'role' => UserRole::Supervisor,
        'email_verified_at' => now(),
    ]);
    $supervisor = Supervisor::factory()->create([
        'user_id' => $supervisorUser->id,
        'company_id' => Company::factory()->create()->id,
    ]);

    $placement = Placement::factory()->create([
        'supervisor_id' => $supervisor->id,
        'student_id' => Student::factory()->create()->id,
        'company_id' => $supervisor->company_id,
        'adviser_id' => Adviser::factory()->create()->id,
        'ojt_batch_id' => OjtBatch::factory()->create()->id,
        'status' => 'active',
    ]);

    $document = Document::factory()->create([
        'placement_id' => $placement->id,
        'status' => 'pending',
    ]);

    $this->actingAs($supervisorUser)
        ->patch(route('documents.update', $document), [
            'status' => 'verified',
        ])
        ->assertRedirect();
});

it('allows evaluators to delete their own evaluations', function () {
    $supervisorUser = User::factory()->create([
        'role' => UserRole::Supervisor,
        'email_verified_at' => now(),
    ]);

    $evaluation = Evaluation::factory()->create([
        'evaluator_id' => $supervisorUser->id,
        'evaluator_type' => 'supervisor',
    ]);

    $this->actingAs($supervisorUser)
        ->delete(route('evaluations.destroy', $evaluation))
        ->assertRedirect();
});
