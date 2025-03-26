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

            
            // Product Information
            $table->foreignId('product_image_id')->nullable();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 16)->default('draft'); // draft, published, archived

            // Product Settings
            $table->string('default_currency', 3)->default('USD');
            $table->boolean('is_subscription_enabled')->default(false);
            $table->boolean('is_one_time_enabled')->default(true);
            
            // Additional Configuration
            $table->jsonb('view')->nullable(); // UI/display settings
            $table->jsonb('properties')->nullable(); // Additional product properties
            $table->text('transaction_webhook_url')->nullable();

            // Timestamps and Soft Delete
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['organization_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_offers');
    }
};
