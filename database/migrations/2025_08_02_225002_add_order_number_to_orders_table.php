<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedInteger('order_number')->nullable()->after('id');
            $table->index(['organization_id', 'order_number']);
        });

        // Populate existing orders with their primary key as order number
        DB::table('orders')->update(['order_number' => DB::raw('id')]);

        // Make the column non-nullable after populating existing data
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedInteger('order_number')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'order_number']);
            $table->dropColumn('order_number');
        });
    }
};
