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
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->text('error_message')->nullable()->after('customer_id');
            $table->string('error_code')->nullable()->after('error_message');
            $table->json('error_details')->nullable()->after('error_code');
            $table->timestamp('failed_at')->nullable()->after('error_details');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->dropColumn(['error_message', 'error_code', 'error_details', 'failed_at']);
        });
    }
};
