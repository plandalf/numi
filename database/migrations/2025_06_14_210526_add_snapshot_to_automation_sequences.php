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
        Schema::table('automation_sequences', function (Blueprint $table) {
            if (!Schema::hasColumn('automation_sequences', 'snapshot')) {
                $table->json('snapshot')->nullable();
            }
            if (!Schema::hasColumn('automation_sequences', 'is_published')) {
                $table->boolean('is_published')->default(false);
            }
            if (!Schema::hasColumn('automation_sequences', 'version')) {
                $table->integer('version')->default(1);
            }
            if (!Schema::hasColumn('automation_sequences', 'last_published_at')) {
                $table->timestamp('last_published_at')->nullable();
            }
            if (!Schema::hasColumn('automation_sequences', 'description')) {
                $table->text('description')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('automation_sequences', function (Blueprint $table) {
            $columns = ['snapshot', 'is_published', 'version', 'last_published_at', 'description'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('automation_sequences', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
