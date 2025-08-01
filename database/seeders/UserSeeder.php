<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public static $adminEmail = 'dev@plandalf.com';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::updateOrCreate(
            ['email' => 'dev@plandalf.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
            ]
        );

        // Create regular users (only if they don't exist)
        $existingUsersCount = User::where('email', '!=', 'dev@plandalf.com')->count();
        if ($existingUsersCount < 10) {
            $usersToCreate = 10 - $existingUsersCount;
            User::factory($usersToCreate)->create();
        }
    }
}
