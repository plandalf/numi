<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    static $adminEmail = 'dev@plandalf.com';
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'dev@plandalf.com',
            'password' => bcrypt('password'),
        ]);

        // Create regular users
        User::factory(10)->create();
    }
}
