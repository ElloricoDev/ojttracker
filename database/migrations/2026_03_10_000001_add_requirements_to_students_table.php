<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedInteger('required_hours')->default(486)->after('year_level');
            $table->foreignId('ojt_batch_id')->nullable()->after('required_hours')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['ojt_batch_id']);
            $table->dropColumn(['required_hours', 'ojt_batch_id']);
        });
    }
};
