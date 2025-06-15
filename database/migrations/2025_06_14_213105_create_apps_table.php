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
        Schema::create('apps', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'gmail', 'slack', 'webhook'
            $table->string('name'); // e.g., 'Gmail', 'Slack', 'Webhook'
            $table->text('description')->nullable();
            $table->string('icon_url')->nullable();
            $table->string('color', 7)->default('#6366f1'); // Hex color for UI
            $table->string('category')->default('general'); // e.g., 'email', 'communication', 'storage'
            $table->boolean('is_active')->default(true);
            $table->boolean('is_built_in')->default(false); // Built-in vs custom apps
            
            // Authentication configuration
            $table->json('auth_config')->nullable(); // OAuth, API key, etc.
            
            // Available actions for this app
            $table->json('actions')->nullable(); // Array of action definitions
            
            // Available triggers for this app  
            $table->json('triggers')->nullable(); // Array of trigger definitions
            
            // Webhook configuration if app supports webhooks
            $table->json('webhook_config')->nullable();
            
            // Rate limiting and API constraints
            $table->json('rate_limits')->nullable();
            
            // App-specific metadata
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            $table->index(['is_active', 'category']);
            $table->index('is_built_in');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apps');
    }
};
