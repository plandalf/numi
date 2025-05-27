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
            $table->string('primary_contrast_color', 9)->nullable()->after('primary_color');
            $table->string('secondary_contrast_color', 9)->nullable()->after('secondary_color');
            $table->string('label_text_color', 9)->nullable()->after('secondary_surface_color');
            $table->string('body_text_color', 9)->nullable()->after('label_text_color');
            $table->string('shadow', 64)->nullable()->after('border_radius');
            
            $table->dropColumn('light_text_color');
            $table->dropColumn('dark_text_color');
            $table->dropColumn('danger_color');
            $table->dropColumn('info_color');
            $table->dropColumn('h6_typography');
            $table->dropColumn('shadow_sm');
            $table->dropColumn('shadow_md');
            $table->dropColumn('shadow_lg');

            $table->dropColumn('padding');
            $table->dropColumn('spacing');
            $table->dropColumn('margin');
            $table->string('padding', 32)->nullable()->after('shadow');
            $table->string('spacing', 32)->nullable()->after('padding');
            $table->string('margin', 32)->nullable()->after('spacing');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->string('light_text_color', 9)->nullable();
            $table->string('dark_text_color', 9)->nullable();
            $table->string('danger_color', 9)->nullable();
            $table->string('info_color', 9)->nullable();
            $table->json('h6_typography')->nullable();
            $table->string('shadow_sm', 64)->nullable();
            $table->string('shadow_md', 64)->nullable();
            $table->string('shadow_lg', 64)->nullable();
        });
    }
};
