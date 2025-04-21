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
        Schema::table('catalog_products', function (Blueprint $table) {
            $table->foreignId('integration_id')->after('id')->index();
        });

        Schema::table('catalog_prices', function (Blueprint $table) {
            $table->foreignId('integration_id')->after('id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('catalog_products', function (Blueprint $table) {
            $table->dropColumn('integration_id');
        });

        Schema::table('catalog_prices', function (Blueprint $table) {
            $table->dropColumn('integration_id');
        });
    }
};
