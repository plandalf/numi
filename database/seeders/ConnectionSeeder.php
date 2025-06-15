<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Automation\App;
use App\Models\Automation\Connection;
use App\Models\User;

class ConnectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        if (!$user || !$user->currentOrganization) {
            $this->command->info('No user or organization found, skipping connection seeding');
            return;
        }

        $org = $user->currentOrganization;

        // Create test connections for apps that don't require complex auth
        $testConnections = [
            [
                'app_key' => 'webhook',
                'name' => 'Test Webhook Connection',
                'description' => 'A test webhook connection for development',
                'config' => []
            ],
            [
                'app_key' => 'email',
                'name' => 'Test SMTP Connection',
                'description' => 'A test email connection for development',
                'config' => [
                    'host' => 'smtp.mailtrap.io',
                    'port' => 587,
                    'username' => 'test',
                    'encryption' => 'tls'
                ]
            ]
        ];

        foreach ($testConnections as $connectionData) {
            $app = App::where('key', $connectionData['app_key'])->first();
            if (!$app) {
                continue;
            }

            Connection::updateOrCreate(
                [
                    'app_id' => $app->id,
                    'organization_id' => $org->id,
                    'name' => $connectionData['name']
                ],
                [
                    'user_id' => $user->id,
                    'description' => $connectionData['description'],
                    'is_active' => true,
                    'config' => $connectionData['config'],
                    'auth_data' => null, // No real auth data for test connections
                ]
            );
        }

        $this->command->info('Test connections created successfully');
    }
}
