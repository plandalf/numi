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
        Schema::rename('store_offer_slots', 'store_offer_items');

        Schema::table('checkout_line_items', function (Blueprint $table) {
            $table->renameColumn('slot_id', 'offer_item_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('slot_id', 'offer_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('store_offer_items', 'store_offer_slots');

        Schema::table('checkout_line_items', function (Blueprint $table) {
            $table->renameColumn('offer_item_id', 'slot_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('offer_item_id', 'slot_id');
        });
    }
};
