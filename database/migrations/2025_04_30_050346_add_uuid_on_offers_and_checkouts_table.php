<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('store_offers', function (Blueprint $table) {
            $table->uuid('uuid')->after('id')->nullable();
        });

        // Generate UUIDs for existing store_offers records
        DB::table('store_offers')->whereNull('uuid')->orderBy('id')->each(function ($offer) {
            DB::table('store_offers')
                ->where('id', $offer->id)
                ->update(['uuid' => Str::uuid()]);
        });

        Schema::table('store_offers', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
            $table->unique('uuid');
        });

        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->uuid('uuid')->after('id')->nullable();
        });

        // Generate UUIDs for existing checkout_sessions records
        DB::table('checkout_sessions')->whereNull('uuid')->orderBy('id')->each(function ($session) {
            DB::table('checkout_sessions')
                ->where('id', $session->id)
                ->update(['uuid' => Str::uuid()]);
        });

        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
            $table->unique('uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offers', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });

        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
