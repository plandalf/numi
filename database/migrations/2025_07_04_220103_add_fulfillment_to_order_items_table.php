<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\FulfillmentStatus;
use App\Enums\DeliveryMethod;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('fulfillment_status')->default(FulfillmentStatus::PENDING->value)->after('metadata');
            $table->string('delivery_method')->nullable()->after('fulfillment_status');
            $table->integer('quantity_fulfilled')->default(0)->after('delivery_method');
            $table->integer('quantity_remaining')->nullable()->after('quantity_fulfilled');
            $table->json('fulfillment_data')->nullable()->after('quantity_remaining');
            $table->json('delivery_assets')->nullable()->after('fulfillment_data');
            $table->string('tracking_number')->nullable()->after('delivery_assets');
            $table->string('tracking_url')->nullable()->after('tracking_number');
            $table->timestamp('expected_delivery_date')->nullable()->after('tracking_url');
            $table->timestamp('delivered_at')->nullable()->after('expected_delivery_date');
            $table->timestamp('fulfilled_at')->nullable()->after('delivered_at');
            $table->foreignId('fulfilled_by_user_id')->nullable()->constrained('users')->after('fulfilled_at');
            $table->text('fulfillment_notes')->nullable()->after('fulfilled_by_user_id');
            $table->text('unprovisionable_reason')->nullable()->after('fulfillment_notes');
            $table->json('external_platform_data')->nullable()->after('unprovisionable_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['fulfilled_by_user_id']);
            $table->dropColumn([
                'fulfillment_status',
                'delivery_method',
                'quantity_fulfilled',
                'quantity_remaining',
                'fulfillment_data',
                'delivery_assets',
                'tracking_number',
                'tracking_url',
                'expected_delivery_date',
                'delivered_at',
                'fulfilled_at',
                'fulfilled_by_user_id',
                'fulfillment_notes',
                'unprovisionable_reason',
                'external_platform_data',
            ]);
        });
    }
};
