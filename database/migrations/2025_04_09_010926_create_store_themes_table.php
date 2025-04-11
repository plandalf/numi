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
            
            // Color Component fields
            $table->string('color_components_primary_color')->nullable();
            $table->string('color_components_secondary_color')->nullable();
            $table->string('color_components_canvas')->nullable();
            $table->string('color_components_primary_surface')->nullable();
            $table->string('color_components_secondary_surface')->nullable();
            $table->string('color_components_primary_border')->nullable();
            $table->string('color_components_secondary_border')->nullable();
            
            // Color Text fields
            $table->string('color_text_light_text')->nullable();
            $table->string('color_text_dark_text')->nullable();
            
            // Color Status fields
            $table->string('color_status_danger')->nullable();
            $table->string('color_status_info')->nullable();
            $table->string('color_status_warning')->nullable();
            $table->string('color_status_success')->nullable();
            $table->string('color_status_highlight')->nullable();
            
            // Typography main fields
            $table->string('typography_main_font')->nullable();
            $table->string('typography_mono_font')->nullable();
            
            // Typography heading fields - H1
            $table->string('typography_h1_size')->nullable();
            $table->string('typography_h1_font')->nullable();
            $table->string('typography_h1_weight')->nullable();
            
            // Typography heading fields - H2
            $table->string('typography_h2_size')->nullable();
            $table->string('typography_h2_font')->nullable();
            $table->string('typography_h2_weight')->nullable();
            
            // Typography heading fields - H3
            $table->string('typography_h3_size')->nullable();
            $table->string('typography_h3_font')->nullable();
            $table->string('typography_h3_weight')->nullable();
            
            // Typography heading fields - H4
            $table->string('typography_h4_size')->nullable();
            $table->string('typography_h4_font')->nullable();
            $table->string('typography_h4_weight')->nullable();
            
            // Typography heading fields - H5
            $table->string('typography_h5_size')->nullable();
            $table->string('typography_h5_font')->nullable();
            $table->string('typography_h5_weight')->nullable();
            
            // Typography heading fields - H6
            $table->string('typography_h6_size')->nullable();
            $table->string('typography_h6_font')->nullable();
            $table->string('typography_h6_weight')->nullable();
            
            // Typography Label fields
            $table->string('typography_label_size')->nullable();
            $table->string('typography_label_font')->nullable();
            $table->string('typography_label_weight')->nullable();
            
            // Typography Body fields
            $table->string('typography_body_size')->nullable();
            $table->string('typography_body_font')->nullable();
            $table->string('typography_body_weight')->nullable();
            
            // Component fields
            $table->string('components_border_radius')->nullable();
            $table->string('components_shadow_sm')->nullable();
            $table->string('components_shadow_md')->nullable();
            $table->string('components_shadow_lg')->nullable();
            
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
