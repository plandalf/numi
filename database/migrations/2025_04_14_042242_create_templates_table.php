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
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('category', 255)->nullable();
            $table->foreignId('theme_id')->nullable()->constrained('themes')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->jsonb('view')->nullable();
            $table->jsonb('preview_images')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['organization_id', 'category']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
