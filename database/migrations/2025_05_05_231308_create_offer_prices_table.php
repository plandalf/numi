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
        Schema::create('store_offer_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->index() ;
            $table->foreignId('price_id')->index();
            $table->foreignId('offer_product_id')->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_offer_prices');
    }
};
