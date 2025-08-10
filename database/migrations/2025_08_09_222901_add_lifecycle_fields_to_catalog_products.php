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
        Schema::table('catalog_products', function (Blueprint $table) {
            $table->foreignId('parent_product_id')
                ->nullable()
                ->after('organization_id')
                ->constrained('catalog_products')
                ->nullOnDelete();

            $table->string('current_state')
                ->default('draft')
                ->after('status')
                ->index();

            $table->timestamp('activated_at')->nullable()->after('archived_at')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('catalog_products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_product_id');
            $table->dropColumn(['current_state', 'activated_at']);
        });
    }
};
