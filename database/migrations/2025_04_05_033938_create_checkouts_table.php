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
        Schema::create('store_checkouts', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });

        Schema::create('store_checkout_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkout_id')->constrained('store_checkouts');
            $table->foreignId('price_id')->constrained('catalog_prices');
            $table->integer('quantity');

            // checkout -> converts to an "order" or multiple?
            // side-effects of an order when its provisioned?

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_checkout_items');
        Schema::dropIfExists('store_checkouts');
    }
};