<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('integrations', function (Blueprint $table) {
            if (!Schema::hasColumn('integrations', 'uuid')) {
                $table->uuid('uuid')->nullable()->after('id');
            }
        });

        $rows = DB::table('integrations')->whereNull('uuid')->get();
        foreach ($rows as $row) {
            DB::table('integrations')->where('id', $row->id)->update([
                'uuid' => Str::uuid(),
            ]);
        }
    }

    public function down(): void
    {
        //
    }
};
