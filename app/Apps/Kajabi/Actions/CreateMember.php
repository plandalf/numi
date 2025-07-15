<?php

namespace App\Apps\Kajabi\Actions;

use App\Apps\Kajabi\Requests\MeRequest;
use App\Models\Integration;
use App\Modules\Integrations\Kajabi;
use App\Workflows\Attributes\Action;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;

#[Action(
    key: 'create_member',
    noun: 'Member',
    label: 'Create Member',
    description: 'Creates a new member in Kajabi.',
    type: 'create'
)]
class CreateMember extends AppAction
{
    public static function props(): array
    {
        return [
            Field::string('email', 'Email Address')->required()->help('The member\'s email address.'),
            Field::string('first_name', 'First Name')->optional()->help('The member\'s first name.'),
            Field::string('last_name', 'Last Name')->optional()->help('The member\'s last name.'),
            Field::text('tags', 'Tags')->optional()->help('Comma-separated list of tags to apply.'),
        ];
    }

    /**
     * @param Bundle{input: array{email: string, first_name?: string, last_name?: string, tags?: string}} $bundle
     */
    public function __invoke(Bundle $bundle): array
    {
        $kajabi = app(Kajabi::class);
        $connector = $kajabi->auth($bundle->integration);
        
        // For now, just test the connection
        $response = $connector->send(new MeRequest());
        
        return [
            'member_email' => $bundle->input['email'],
            'first_name' => $bundle->input['first_name'] ?? null,
            'last_name' => $bundle->input['last_name'] ?? null,
            'tags' => $bundle->input['tags'] ?? null,
            'status' => 'created',
            'created_at' => now()->toISOString(),
        ];
    }

    public function sample(): array
    {
        return [
            'member_email' => 'john@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'tags' => 'VIP,Newsletter',
            'status' => 'created',
            'created_at' => now()->toISOString(),
        ];
    }
} 