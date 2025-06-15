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
        Schema::table('workflows', function (Blueprint $table) {
            $table->foreignId('sequence_id')->nullable()->after('organization_id')->constrained('automation_sequences')->nullOnDelete();
            $table->index(['sequence_id', 'organization_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->dropForeign(['sequence_id']);
            $table->dropIndex(['sequence_id', 'organization_id']);
            $table->dropColumn('sequence_id');
        });
    }
};
