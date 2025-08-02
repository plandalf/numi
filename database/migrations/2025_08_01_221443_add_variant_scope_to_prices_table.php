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
        // Note: Since scope is already a string column, we don't need to modify the schema
        // The application will handle the 'variant' value validation
        // If you want to add a check constraint, you can uncomment below:
        
        // Schema::table('catalog_prices', function (Blueprint $table) {
        //     $table->dropIndex(['scope']);
        // });
        
        // DB::statement("ALTER TABLE catalog_prices ADD CONSTRAINT check_scope CHECK (scope IN ('list', 'custom', 'variant'))");
        
        // Schema::table('catalog_prices', function (Blueprint $table) {
        //     $table->index('scope');
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // If you added the check constraint above, uncomment below:
        // DB::statement("ALTER TABLE catalog_prices DROP CONSTRAINT IF EXISTS check_scope");
    }
};
