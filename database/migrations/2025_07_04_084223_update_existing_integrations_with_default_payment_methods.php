<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Integration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing integrations to have default payment methods
        Integration::chunk(100, function ($integrations) {
            foreach ($integrations as $integration) {
                $config = $integration->config ?? [];
                if (!isset($config['payment_methods'])) {
                    $config['payment_methods'] = ['card', 'apple_pay', 'google_pay'];
                    $integration->update(['config' => $config]);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove payment_methods from existing integrations config
        Integration::chunk(100, function ($integrations) {
            foreach ($integrations as $integration) {
                $config = $integration->config ?? [];
                if (isset($config['payment_methods'])) {
                    unset($config['payment_methods']);
                    $integration->update(['config' => $config]);
                }
            }
        });
    }
};
