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
        Schema::table('organizations', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->string('website_url')->nullable()->after('description');
            $table->foreignId('logo_media_id')->nullable()->after('website_url')->constrained('medias')->nullOnDelete();
            $table->foreignId('favicon_media_id')->nullable()->after('logo_media_id')->constrained('medias')->nullOnDelete();
            $table->string('primary_color', 7)->nullable()->after('favicon_media_id'); // #RRGGBB format
            $table->json('social_media')->nullable()->after('primary_color'); // Store social media URLs
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropForeign(['logo_media_id']);
            $table->dropForeign(['favicon_media_id']);
            
            $table->dropColumn([
                'description',
                'website_url',
                'primary_color',
                'social_media',
            ]);
        });
    }
};
