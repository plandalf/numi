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
        Schema::table('store_offers', function (Blueprint $table) {
            $table->foreignUuid('social_image_id')->nullable()->after('product_image_id')->constrained('medias')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_offers', function (Blueprint $table) {
            $table->dropForeign(['social_image_id']);
            $table->dropColumn('social_image_id');
        });
    }
};
