<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\ExternalPlatform;
use App\Enums\FulfillmentStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('external_fulfillments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('platform')->index();
            $table->string('external_order_id')->index();
            $table->string('external_fulfillment_id')->nullable()->index();
            $table->string('status')->default(FulfillmentStatus::PENDING->value);
            $table->json('order_data');
            $table->json('fulfillment_data')->nullable();
            $table->json('customer_data')->nullable();
            $table->json('items_data')->nullable();
            $table->string('tracking_number')->nullable();
            $table->string('tracking_url')->nullable();
            $table->timestamp('external_order_created_at')->nullable();
            $table->timestamp('external_fulfilled_at')->nullable();
            $table->timestamp('external_delivered_at')->nullable();
            $table->text('webhook_signature')->nullable();
            $table->json('webhook_headers')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['platform', 'external_order_id']);
            $table->index(['organization_id', 'platform']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_fulfillments');
    }
};
