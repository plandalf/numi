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
        // First, set all empty customer_id values to NULL
        DB::table('checkout_sessions')->where('customer_id', '')->update(['customer_id' => null]);
        
        Schema::table('checkout_sessions', function (Blueprint $table) {
            // First change the column type from UUID to bigInteger
            $table->unsignedBigInteger('customer_id')->nullable()->change();
            // Then add the foreign key constraint
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            // Change back to UUID
            $table->uuid('customer_id')->nullable()->change();
        });
    }
};
