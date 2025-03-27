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
        Schema::create('store_offer_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained('store_offers')->cascadeOnDelete();
            $table->foreignId('media_id')->nullable()->constrained('medias')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['one_time', 'subscription']);
            $table->enum('pricing_model', ['standard', 'graduated', 'volume', 'package']);
            $table->integer('amount')->nullable(); // Amount in cents
            $table->string('currency', 3)->default('USD');
            $table->json('properties')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_offer_variants');
    }
};
