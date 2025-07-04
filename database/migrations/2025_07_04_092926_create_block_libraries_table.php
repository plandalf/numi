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
        Schema::create('block_libraries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name'); // User-defined name for the block
            $table->string('description')->nullable(); // Optional description
            $table->string('block_type'); // Original block type (e.g., 'text', 'button', etc.)
            $table->string('category')->nullable(); // Category for organization
            $table->jsonb('configuration'); // Complete block configuration (content, style, appearance, etc.)
            $table->string('preview_image_url')->nullable(); // Optional preview image
            $table->json('tags')->nullable(); // Tags for better organization and search
            $table->integer('usage_count')->default(0); // Track how often this block is used
            $table->timestamps();
            $table->softDeletes();

            // Indexes for better query performance
            $table->index(['organization_id', 'block_type']);
            $table->index(['organization_id', 'category']);
            $table->index('usage_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('block_libraries');
    }
};
