<?php

use App\Enums\ProductStatus;
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
            $table->foreignId('integration_id')->after('id')->nullable()->index();
            $table->text('description')->nullable()->after('name');
            $table->enum('status', array_map(fn(ProductStatus $case) => $case->value, ProductStatus::cases()))->default(ProductStatus::draft->value)
                ->after('gateway_product_id');
        });

        Schema::table('catalog_prices', function (Blueprint $table) {
            $table->foreignId('integration_id')->after('id')->nullable()->index();
            $table->jsonb('metadata')->nullable();

            $table->unique(['organization_id', 'integration_id', 'gateway_price_id'], 'unique_price_per_integration');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('catalog_products', function (Blueprint $table) {
            $table->dropColumn('integration_id');
            $table->dropColumn('description');
            $table->dropColumn('status');
        });

        Schema::table('catalog_prices', function (Blueprint $table) {
            $table->dropColumn('integration_id');
            $table->dropUnique('unique_price_per_integration');
            $table->dropColumn('metadata');
        });
    }
};
