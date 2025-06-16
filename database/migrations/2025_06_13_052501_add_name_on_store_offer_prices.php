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
        Schema::table('store_offer_prices', function (Blueprint $table) {
            $table->string('name')->nullable()->after('price_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offer_prices', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};
