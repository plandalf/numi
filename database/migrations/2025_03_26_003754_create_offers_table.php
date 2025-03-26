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

            $table->string('name')->nullable();
            $table->string('status', 16)->default('draft'); // or published

            $table->jsonb('view')->nullable();
            $table->jsonb('properties')->nullable();

            $table->text('transaction_webhook_url')->nullable();

            $table->timestamps();
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
