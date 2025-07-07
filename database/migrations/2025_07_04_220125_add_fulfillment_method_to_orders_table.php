<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\FulfillmentMethod;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('fulfillment_method')->default(FulfillmentMethod::MANUAL->value)->after('organization_id');
            $table->json('fulfillment_config')->nullable()->after('fulfillment_method');
            $table->boolean('fulfillment_notified')->default(false)->after('fulfillment_config');
            $table->timestamp('fulfillment_notified_at')->nullable()->after('fulfillment_notified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'fulfillment_method',
                'fulfillment_config',
                'fulfillment_notified',
                'fulfillment_notified_at',
            ]);
        });
    }
};
