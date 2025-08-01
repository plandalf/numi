<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use App\Http\Controllers\ImpersonationController;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Route;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            OrganizationSeeder::class,
            ThemeSeeder::class,
            AutomationSeeder::class,
            OfferSeeder::class,
            // ProductSeeder::class,
            // OfferSeeder::class,
            // CheckoutSessionSeeder::class,
            // OrderSeeder::class,
        ]);

        $this->call([
            // TemplateSeeder::class,
        ]);

        // Display final impersonation link for local development
        if (app()->environment('local')) {
            $demoOrg = Organization::where('name', 'Demo Organization')->first();
            $adminUser = User::where('email', 'dev@plandalf.com')->first();
            
            if ($demoOrg && $adminUser) {
                $this->command->info('');
                $this->command->info('🎉 Database seeding completed successfully!');
                $this->command->info('');
                $this->command->info('=== DEVELOPMENT QUICK LOGIN ===');
                $this->command->info("👤 User: {$adminUser->name} ({$adminUser->email})");
                $this->command->info("🏢 Organization: {$demoOrg->name}");
                $this->command->info("⏰ Trial: 1 year (until " . $demoOrg->trial_ends_at->format('M j, Y') . ")");
                $this->command->info("🔗 Apps: Shopify, Slack, Webhook integrations created");
                $this->command->info("📋 Automation: Sample workflows and triggers ready");
                $this->command->info("🛍️  Offers: Course, coaching, membership offers created");
                $this->command->info('');
                
                // Check if the impersonate route exists before trying to generate the URL
                if (Route::has('impersonate')) {
                    try {
                        $impersonationUrl = ImpersonationController::generateImpersonationUrl($adminUser, 240); // 4 hours
                        
                        $this->command->info("⚡ Quick login link (expires in 4 hours):");
                        $this->command->line($impersonationUrl);
                        $this->command->info('');
                        $this->command->warn('🔒 This impersonation link only works in local development environment.');
                        $this->command->info('Copy and paste the URL above in your browser to login automatically.');
                    } catch (Exception $e) {
                        $this->command->warn('⚠️ Could not generate impersonation link: ' . $e->getMessage());
                        $this->command->info('💡 Tip: You can login manually with email: dev@plandalf.com password: password');
                    }
                } else {
                    $this->command->warn('⚠️ Impersonation route not found - this is expected in production.');
                    $this->command->info('💡 Login manually with email: dev@plandalf.com password: password');
                }
                
                $this->command->info('================================');
            }
        }
    }
}
