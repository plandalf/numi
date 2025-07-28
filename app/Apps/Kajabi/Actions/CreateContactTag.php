<?php

namespace App\Apps\Kajabi\Actions;

use App\Models\Integration;
use App\Workflows\Attributes\IsAction;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;

#[IsAction(
    key: 'create_contact_tag',
    noun: 'Contact Tag',
    label: 'Create Contact Tag',
    description: 'Creates a new contact tag in Kajabi.',
    type: 'create'
)]
class CreateContactTag extends AppAction
{
    public static function props(): array
    {
        return [
            Field::string('name', 'Tag Name')->required()->help('The tag\'s name.'),
            Field::string('contact', 'Contact')
                ->dynamic('contact.id,name')
                ->required()
                ->help('the contact to tag'),
        ];
    }

    /**
     * @param Bundle{input: array{name: string, contact: string}} $bundle
     */
    public function __invoke(Bundle $bundle): array
    {
        // For testing purposes, just return a mock response
        // In a real implementation, this would make an API call to Kajabi
        return [
            'tag_name' => $bundle->input['name'],
            'contact_id' => $bundle->input['contact'],
            'status' => 'created',
            'created_at' => now()->toISOString(),
            'message' => 'Contact tag created successfully (test mode)',
        ];
    }

    public function sample(): array
    {
        return [
            'tag_name' => 'VIP Customer',
            'contact_id' => '12345',
            'status' => 'created',
            'created_at' => now()->toISOString(),
        ];
    }
}
