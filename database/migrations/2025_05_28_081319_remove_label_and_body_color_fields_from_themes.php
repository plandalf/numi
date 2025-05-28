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
        Schema::table('themes', function (Blueprint $table) {
            $table->dropColumn('label_text_color');
            $table->dropColumn('body_text_color');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->string('label_text_color', 9)->nullable()->after('secondary_surface_color');
            $table->string('body_text_color', 9)->nullable()->after('label_text_color');
        });
    }
};
