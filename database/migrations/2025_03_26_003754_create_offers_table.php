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
        Schema::create('store_offers', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('organization_id');
            $table->bigInteger('product_image_id')->nullable();

            // Product Information
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 16)->default('draft');

            // Additional Configuration
            $table->jsonb('view')->nullable();
            $table->jsonb('properties')->nullable();

            // Timestamps and Soft Delete
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['organization_id', 'status']);
        });

        Schema::create('store_offer_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained('store_offers')->cascadeOnDelete();
            $table->string('key');
            $table->string('name');
            $table->foreignId('default_price_id')->nullable();
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_offer_slots');
        Schema::dropIfExists('store_offers');
    }
};
