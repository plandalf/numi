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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('organization_id');
            $table->bigInteger('integration_id')->nullable();
            $table->string('reference_id', 128);
            $table->string('name', 128)->nullable();
            $table->string('email', 128)->nullable();
            $table->string('currency', 3)->nullable();
            $table->string('timezone', 32)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->bigInteger('customer_id')->index()->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('customer_id');
        });
    }
};
