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
        Schema::table('store_offers', function (Blueprint $table) {
            $table->foreignId('theme_id')->nullable()->after('organization_id')->constrained('store_themes')->nullOnDelete();
            $table->index('theme_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offers', function (Blueprint $table) {
            $table->dropForeign(['theme_id']);
            $table->dropIndex(['theme_id']);
            $table->dropColumn('theme_id');
        });
    }
};
