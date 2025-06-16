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
            $table->boolean('is_tax_inclusive')->default(true)->after('is_highlighted');
            $table->decimal('tax_rate', 10, 2)->nullable()->after('is_tax_inclusive');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offer_items', function (Blueprint $table) {
            $table->dropColumn('is_tax_inclusive');
            $table->dropColumn('tax_rate');
        });
    }
};
