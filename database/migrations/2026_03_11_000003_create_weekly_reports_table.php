<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('placement_id')->constrained()->cascadeOnDelete();
            $table->date('week_start')->index();
            $table->date('week_end')->index();
            $table->text('accomplishments');
            $table->decimal('hours_rendered', 6, 2);
            $table->string('status')->default('submitted')->index();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reviewer_comment')->nullable();
            $table->timestamps();

            $table->unique(['placement_id', 'week_start', 'week_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_reports');
    }
};
