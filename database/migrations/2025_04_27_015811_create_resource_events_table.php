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
        // First, drop the existing foreign key constraint
        DB::statement('ALTER TABLE orders DROP FOREIGN KEY orders_checkout_session_id_foreign');

        // Then modify the column to be nullable
        DB::statement('ALTER TABLE orders MODIFY checkout_session_id BIGINT UNSIGNED NULL');

        // Finally, add the new foreign key constraint with SET NULL
        DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_checkout_session_id_foreign
                      FOREIGN KEY (checkout_session_id) REFERENCES checkout_sessions(id) ON DELETE SET NULL');

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
        // First, drop the foreign key constraint
        DB::statement('ALTER TABLE orders DROP FOREIGN KEY orders_checkout_session_id_foreign');

        // Then modify the column back to NOT NULL
        DB::statement('ALTER TABLE orders MODIFY checkout_session_id BIGINT UNSIGNED NOT NULL');

        // Finally, recreate the original foreign key constraint with CASCADE
        DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_checkout_session_id_foreign
                      FOREIGN KEY (checkout_session_id) REFERENCES checkout_sessions(id) ON DELETE CASCADE');

        Schema::dropIfExists('resource_events');
    }
};
