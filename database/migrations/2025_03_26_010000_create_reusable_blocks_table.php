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
        Schema::create('reusable_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name'); // User-defined name for the block
            $table->string('block_type'); // Original block type (e.g., 'text', 'button', etc.)
            $table->jsonb('configuration'); // Complete block configuration (content, style, appearance, etc.)
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'block_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reusable_blocks');
    }
};
