<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrganizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create demo organization
        $demoOrg = Organization::factory()->create([
            'name' => 'Demo Organization',
            'default_currency' => 'USD',
        ]);

        // Attach admin user to demo organization
        $adminUser = User::where('email', 'dev@plandalf.com')->first();
        if ($adminUser) {
            $demoOrg->users()->attach($adminUser->id);
            $adminUser->current_organization_id = $demoOrg->id;
            $adminUser->save();
        }

        // Create additional organizations
        Organization::factory(5)->create()->each(function ($organization) {
            // Attach 2-3 random users to each organization
            $users = User::inRandomOrder()->limit(rand(2, 3))->get();
            $organization->users()->attach($users->pluck('id'));
        });
    }
}
