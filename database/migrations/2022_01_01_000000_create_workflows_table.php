<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

final class CreateWorkflowsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workflows', static function (Blueprint $table): void {
            $table->id();
            $table->bigInteger('organization_id')->nullable();
            $table->text('class');
            $table->text('arguments')->nullable();
            $table->text('output')->nullable();
            $table->string('status')->default('pending')->index();
            $table->timestamps(6);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflows');
    }
}
