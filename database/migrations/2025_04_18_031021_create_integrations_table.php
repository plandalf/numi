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
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->string('lookup_key', 64);
            $table->string('type', 32);
            $table->foreignId('organization_id');
            $table->string('name', 64)->nullable();
            $table->text('secret')->nullable();
            $table->json('config')->nullable();
            $table->string('current_state')->default('created');
            $table->enum('environment', ['live', 'test']);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['lookup_key', 'organization_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
