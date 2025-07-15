<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('automation_triggers', function (Blueprint $table) {
            // Remove legacy columns that are no longer needed
            $table->dropColumn(['event_name', 'target_type', 'target_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('automation_triggers', function (Blueprint $table) {
            // Add back the legacy columns if needed to rollback
            $table->string('event_name', 32)->nullable();
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
        });
    }
};
