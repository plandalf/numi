<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('organizations')
            ->whereNull('join_token')
            ->get()
            ->each(function ($organization) {
                DB::table('organizations')
                    ->where('id', $organization->id)
                    ->update([
                        'join_token' => hash('sha256', $organization->ulid),
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('organizations')
            ->whereNotNull('join_token')
            ->update(['join_token' => null]);
    }
};
