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
        Schema::table('hosted_pages', function (Blueprint $table) {
            $table->jsonb('appearance')->after('style')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hosted_pages', function (Blueprint $table) {
            $table->dropColumn('appearance');
        });
    }
};
