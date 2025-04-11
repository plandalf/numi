<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique(); // for public status page
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('checkout_session_id')->constrained('checkout_sessions')->onDelete('cascade');
            $table->string('status');
            $table->integer('total_amount')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->text('redirect_url')->nullable(); // Optional custom redirect
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('price_id')->constrained('catalog_prices');
            $table->unsignedBigInteger('slot_id');
            $table->integer('quantity')->default(1);
            $table->integer('total_amount')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
        Schema::dropIfExists('order_items');
    }
}
