<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('automation_triggers', function (Blueprint $table) {
            // Add trigger type to differentiate between webhook and integration triggers
            $table->string('trigger_type', 50)
                ->default('integration')
                ->after('name');

            // Add authentication configuration for webhook triggers
            $table->json('webhook_auth_config')->nullable()->after('webhook_secret');
        });
    }

    public function down(): void
    {
        Schema::table('automation_triggers', function (Blueprint $table) {
            $table->dropIndex(['automation_triggers_trigger_type_index']);
            $table->dropColumn(['trigger_type']);
        });
    }
};
