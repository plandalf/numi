<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('checkout_success_url')->nullable()->after('pm_last_four');
            $table->string('checkout_cancel_url')->nullable()->after('checkout_success_url');
        });

        Schema::table('store_offers', function (Blueprint $table) {
            $table->string('checkout_success_url')->nullable()->after('properties');
            $table->string('checkout_cancel_url')->nullable()->after('checkout_success_url');
        });
    }

    public function down(): void
    {
        Schema::table('store_offers', function (Blueprint $table) {
            $table->dropColumn(['checkout_success_url', 'checkout_cancel_url']);
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['checkout_success_url', 'checkout_cancel_url']);
        });
    }
};
