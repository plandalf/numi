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
        Schema::create('medias', function (Blueprint $table) {
            $table->id();
            $table->string('original_filename');
            $table->string('filename')->unique();
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->string('disk')->default('s3');
            $table->string('path');
            $table->string('status');
            $table->json('meta')->nullable();
            $table->nullableMorphs('mediable');
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medias');
    }
};
