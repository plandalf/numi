<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\FulfillmentMethod;
use App\Enums\DeliveryMethod;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('fulfillment_method')->default(FulfillmentMethod::MANUAL->value)->after('onboarding_mask');
            $table->string('default_delivery_method')->default(DeliveryMethod::MANUAL_PROVISION->value)->after('fulfillment_method');
            $table->json('fulfillment_config')->nullable()->after('default_delivery_method');
            $table->string('fulfillment_notification_email')->nullable()->after('fulfillment_config');
            $table->boolean('auto_fulfill_orders')->default(false)->after('fulfillment_notification_email');
            $table->json('external_platform_config')->nullable()->after('auto_fulfill_orders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'fulfillment_method',
                'default_delivery_method',
                'fulfillment_config',
                'fulfillment_notification_email',
                'auto_fulfill_orders',
                'external_platform_config',
            ]);
        });
    }
};
