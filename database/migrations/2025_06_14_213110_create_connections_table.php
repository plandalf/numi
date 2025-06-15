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
        Schema::create('connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('app_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who created the connection
            
            $table->string('name'); // User-friendly name like "My Gmail Account"
            $table->text('description')->nullable();
            
            // Connection status
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_tested_at')->nullable();
            $table->json('last_test_result')->nullable(); // Success/failure info
            
            // Authentication data (encrypted)
            $table->text('auth_data')->nullable(); // Encrypted OAuth tokens, API keys, etc.
            $table->timestamp('auth_expires_at')->nullable(); // For OAuth tokens
            
            // Connection-specific configuration
            $table->json('config')->nullable(); // App-specific settings
            
            // Usage tracking
            $table->integer('usage_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            
            // Error tracking
            $table->integer('error_count')->default(0);
            $table->timestamp('last_error_at')->nullable();
            $table->text('last_error_message')->nullable();
            
            $table->timestamps();
            
            $table->index(['app_id', 'organization_id', 'is_active']);
            $table->index(['user_id', 'is_active']);
            $table->index('last_used_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('connections');
    }
};
