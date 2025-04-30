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
        Schema::create('catalog_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('lookup_key');

            $table->string('gateway_provider')->nullable()->index();
            $table->string('gateway_product_id')->nullable()->index();

            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('catalog_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('catalog_products')->cascadeOnDelete();
            $table->foreignId('parent_list_price_id')->nullable()->comment('If scope=custom, points to list price base');

            $table->string('lookup_key');
            $table->string('name');
            $table->string('scope')->default('list')->index(); // list or custom
            $table->string('type')->index()->comment('e.g., one_time, recurring, tiered, volume, graduated');

            $table->unsignedBigInteger('amount')->comment('Base price/amount in cents');
            $table->char('currency', 3)->index();
            $table->json('properties')->nullable();

            // Recurring settings (nullable)
            $table->string('renew_interval')->nullable()->index();
            $table->string('billing_anchor')->nullable()->index();
            $table->unsignedSmallInteger('recurring_interval_count')->nullable();
            $table->unsignedSmallInteger('cancel_after_cycles')->nullable();

            // Gateway link, how to actually link these?
            $table->string('gateway_provider')->nullable()->index();
            $table->string('gateway_price_id')->nullable()->index();
            $table->boolean('is_active')->default(true)->index();

            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('parent_list_price_id')->references('id')->on('catalog_prices')->nullOnDelete();
            $table->index(['organization_id', 'product_id', 'lookup_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('catalog_prices');
        Schema::dropIfExists('catalog_products');
    }
};
