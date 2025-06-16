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
        Schema::table('store_offer_items', function (Blueprint $table) {
            $table->boolean('is_highlighted')->default(false)->after('is_required');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offer_items', function (Blueprint $table) {
            $table->dropColumn('is_highlighted');
        });
    }
};
