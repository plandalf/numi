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
        Schema::table('orders', function (Blueprint $table) {
            $table->bigInteger('checkout_session_id')->nullable()->after('organization_id')->change();
            // remove foreign
            // add updaetd_at
        });


        Schema::create('resource_events', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('organization_id');
            $table->char('action', 1); // c r u d p
            $table->morphs('subject');
            $table->jsonb('snapshot')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resource_events');
    }
};
