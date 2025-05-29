<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['checkout_session_id']);
        });

        // Then modify the column to be nullable
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('checkout_session_id')->nullable()->change();
        });

        // Finally, add the new foreign key constraint with SET NULL
        Schema::table('orders', function (Blueprint $table) {
            $table->foreign('checkout_session_id')
                ->references('id')
                ->on('checkout_sessions')
                ->onDelete('set null');
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
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['checkout_session_id']);
                $table->unsignedBigInteger('checkout_session_id')->nullable(false)->change();
                $table->foreign('checkout_session_id')
                    ->references('id')
                    ->on('checkout_sessions')
                    ->onDelete('cascade');
            });
        }

        Schema::dropIfExists('resource_events');
    }
};
