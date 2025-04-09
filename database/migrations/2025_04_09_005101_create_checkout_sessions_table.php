<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('store_checkout_items');
        Schema::dropIfExists('store_checkouts');

        Schema::create('checkout_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->constrained('store_offers');
            $table->string('status');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->jsonb('metadata')->nullable();
            // $table->foreignUuid('customer_id')->nullable()->constrained('customers'); // Optional FK
            $table->timestamps();
        });

        Schema::create('checkout_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('checkout_session_id')->constrained('checkout_sessions')->onDelete('cascade');
            $table->unsignedBigInteger('price_id');
            $table->foreign('price_id')->references('id')->on('catalog_prices');
            $table->unsignedBigInteger('slot_id');
            $table->integer('quantity')->default(1);
            $table->integer('total_amount')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkout_sessions');
        Schema::dropIfExists('checkout_line_items');
    }
};