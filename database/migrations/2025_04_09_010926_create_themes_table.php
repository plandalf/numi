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
        Schema::create('themes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('name')->nullable();
            
            // Color fields with alpha channel
            $table->string('primary_color', 9)->nullable();
            $table->string('secondary_color', 9)->nullable();
            $table->string('canvas_color', 9)->nullable();
            $table->string('primary_surface_color', 9)->nullable();
            $table->string('secondary_surface_color', 9)->nullable();
            $table->string('primary_border_color', 9)->nullable();
            $table->string('secondary_border_color', 9)->nullable();
            $table->string('light_text_color', 9)->nullable();
            $table->string('dark_text_color', 9)->nullable();
            $table->string('danger_color', 9)->nullable();
            $table->string('info_color', 9)->nullable();
            $table->string('warning_color', 9)->nullable();
            $table->string('success_color', 9)->nullable();
            $table->string('highlight_color', 9)->nullable();
            
            // Typography fields
            $table->string('main_font', 64)->nullable();
            $table->string('mono_font', 64)->nullable();
            
            // Typography arrays
            $table->json('h1_typography')->nullable();
            $table->json('h2_typography')->nullable();
            $table->json('h3_typography')->nullable();
            $table->json('h4_typography')->nullable();
            $table->json('h5_typography')->nullable();
            $table->json('h6_typography')->nullable();
            $table->json('label_typography')->nullable();
            $table->json('body_typography')->nullable();
            
            // Component fields
            $table->string('border_radius', 4)->nullable();
            $table->string('shadow_sm', 64)->nullable();
            $table->string('shadow_md', 64)->nullable();
            $table->string('shadow_lg', 64)->nullable();
            
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
        Schema::dropIfExists('themes');
    }
};
