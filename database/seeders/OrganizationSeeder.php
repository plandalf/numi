<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrganizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create demo organization with extended trial period
        $demoOrg = Organization::updateOrCreate(
            ['name' => 'Demo Organization'],
            [
                'default_currency' => 'USD',
                'trial_ends_at' => now()->addYear(), // 1 year trial for demo org
            ]
        );

        // Create default theme if it doesn't exist
        if (!$demoOrg->themes()->exists()) {
            $demoOrg->themes()->create([
                'name' => 'Default theme',
                ...Theme::themeDefaults()
            ]);
        }

        // Attach admin user to demo organization
        $adminUser = User::where('email', 'dev@plandalf.com')->first();
        if ($adminUser) {
            // Check if user is already attached to organization
            if (!$demoOrg->users()->where('user_id', $adminUser->id)->exists()) {
                $demoOrg->users()->attach($adminUser->id);
            }
            
            // Set current organization if not already set
            if (!$adminUser->current_organization_id) {
                $adminUser->current_organization_id = $demoOrg->id;
                $adminUser->save();
            }
        }

        // Create additional organizations if they don't exist (with default trial period)
        $existingOrgs = Organization::where('name', '!=', 'Demo Organization')->count();
        if ($existingOrgs < 5) {
            $orgsToCreate = 5 - $existingOrgs;
            Organization::factory($orgsToCreate)->create()->each(function ($organization) {
                // Set default trial period for other organizations
                $organization->update([
                    'trial_ends_at' => now()->addDays((int) config('cashier.trial_days', 14))
                ]);

                // Attach 2-3 random users to each organization
                $users = User::inRandomOrder()->limit(rand(2, 3))->get();
                foreach ($users as $user) {
                    if (!$organization->users()->where('user_id', $user->id)->exists()) {
                        $organization->users()->attach($user->id);
                    }
                }

                // Create default theme if it doesn't exist
                if (!$organization->themes()->exists()) {
                    $organization->themes()->create([
                        'name' => 'Default theme',
                        ...Theme::themeDefaults()
                    ]);
                }
            });
        }
    }
}
