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
        Schema::table('templates', function (Blueprint $table) {
            $table->jsonb('hosted_page_style')->after('preview_images')->nullable();
            $table->jsonb('hosted_page_appearance')->after('hosted_page_style')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropForeign(['hosted_page_style']);
            $table->dropForeign(['hosted_page_appearance']);
            $table->dropColumn('hosted_page_style');
            $table->dropColumn('hosted_page_appearance');
        });
    }
};
