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
        Schema::table('automation_actions', function (Blueprint $table) {
            $table->integer('sort_order')->nullable()->after('action_key');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('automation_actions', function (Blueprint $table) {
            $table->dropIndex(['sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};
