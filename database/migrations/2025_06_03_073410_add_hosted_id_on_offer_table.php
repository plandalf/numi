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
            $table->bigInteger('hosted_page_id')->after('theme_id')->nullable();
            $table->boolean('is_hosted')->default(false)->after('hosted_page_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offers', function (Blueprint $table) {
            $table->dropColumn('hosted_page_id');
            $table->dropColumn('is_hosted');
        });
    }
};
