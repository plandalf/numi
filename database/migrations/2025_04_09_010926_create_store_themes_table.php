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
        Schema::create('store_themes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->jsonb('color')->nullable();
            $table->jsonb('typography')->nullable();
            $table->jsonb('components')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Add indexes for foreign keys
            $table->index('organization_id');
            
            // Add index for soft deletes
            $table->index('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_themes');
    }
};
