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
        Schema::create('automation_sequences', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('organization_id');
            $table->string('name', 128);
            $table->timestamps();
        });

        Schema::create('automation_triggers', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('sequence_id');
            $table->string('event_name', 32);
            $table->morphs('target');
            $table->bigInteger('next_node_id')->nullable();
            $table->timestamps();
        });

        Schema::create('automation_nodes', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('sequence_id');
            $table->string('type', 32);
            $table->json('arguments')->nullable();
            $table->timestamps();
        });

        Schema::create('automation_edges', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('sequence_id')->nullable();
            $table->bigInteger('from_node_id')->nullable();
            $table->bigInteger('to_node_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_tables');
    }
};
