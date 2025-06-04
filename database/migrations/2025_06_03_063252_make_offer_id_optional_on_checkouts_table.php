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
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->foreignId('offer_id')->nullable()->change();
        });

        Schema::table('checkout_line_items', function (Blueprint $table) {
            $table->unsignedBigInteger('offer_item_id')->nullable()->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('offer_item_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->foreignId('offer_id')->nullable(false)->change();
        });

        Schema::table('checkout_line_items', function (Blueprint $table) {
            $table->unsignedBigInteger('offer_item_id')->nullable(false)->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('offer_item_id')->nullable(false)->change();
        });
    }
};
