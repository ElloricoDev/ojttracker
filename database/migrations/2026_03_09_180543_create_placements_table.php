<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('adviser_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ojt_batch_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('required_hours')->default(486);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('status')->default('pending')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['student_id', 'ojt_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('placements');
    }
};
