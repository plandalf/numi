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
            $table->string('ip_address', 45)->nullable()->after('customer_id');
            $table->string('ip_country', 2)->nullable()->after('ip_address');
            $table->string('parent_page_url', 2048)->nullable()->after('ip_country');
            // Optional end-user subject identifier (from JWT 'sub' or data-subject)
            $table->string('subject', 255)->nullable()->after('parent_page_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->dropColumn('subject');
            $table->dropColumn('parent_page_url');
            $table->dropColumn('ip_country');
            $table->dropColumn('ip_address');
        });
    }
};
