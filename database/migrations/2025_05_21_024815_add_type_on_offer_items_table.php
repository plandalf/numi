<?php

use App\Enums\Store\OfferItemType;
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
        Schema::table('store_offer_items', function (Blueprint $table) {
            $table->char('type', 8)->default(OfferItemType::STANDARD->value)->after('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offer_items', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
