<?php

namespace Database\Seeders;

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
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->create([
            'name' => 'System Admin',
            'email' => 'admin@ojttracker.test',
            'role' => UserRole::Admin,
        ]);

        User::factory()->create([
            'name' => 'OJT Coordinator',
            'email' => 'coordinator@ojttracker.test',
            'role' => UserRole::Coordinator,
        ]);

        $batch = OjtBatch::factory()->create([
            'name' => 'SY 2025-2026 - 2nd Sem',
            'school_year' => '2025-2026',
            'semester' => '2nd',
        ]);

        $companies = Company::factory()->count(5)->create();
        $advisers = Adviser::factory()->count(4)->create();
        $supervisors = collect();

        foreach ($companies as $company) {
            $supervisors = $supervisors->merge(
                Supervisor::factory()->count(2)->create(['company_id' => $company->id])
            );
        }

        $students = Student::factory()->count(25)->create([
            'ojt_batch_id' => $batch->id,
            'required_hours' => 486,
        ]);

        foreach ($students->take(15) as $student) {
            $company = $companies->random();
            $placement = Placement::factory()->create([
                'student_id' => $student->id,
                'company_id' => $company->id,
                'supervisor_id' => $supervisors->where('company_id', $company->id)->random()->id,
                'adviser_id' => $advisers->random()->id,
                'ojt_batch_id' => $batch->id,
                'status' => 'active',
            ]);

            AttendanceLog::factory()->count(3)->create([
                'placement_id' => $placement->id,
            ]);

            for ($i = 0; $i < 3; $i++) {
                DailyReport::factory()->create([
                    'placement_id' => $placement->id,
                    'work_date' => now()->subDays($i + 1)->toDateString(),
                ]);
            }

            Evaluation::factory()->count(2)->create([
                'placement_id' => $placement->id,
                'evaluator_id' => $advisers->random()->user_id,
                'evaluator_type' => 'adviser',
            ]);

            Document::factory()->count(2)->create([
                'placement_id' => $placement->id,
            ]);
        }
    }
}
