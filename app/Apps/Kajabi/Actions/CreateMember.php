<?php

namespace App\Apps\Kajabi\Actions;

use App\Apps\Kajabi\KajabiApp;
use App\Apps\Kajabi\Requests\MeRequest;
use App\Workflows\Attributes\IsAction;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;

#[IsAction(
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
        $kajabi = new KajabiApp();

        $connector = $kajabi->auth($bundle->integration);

        $response = $connector->send(new MeRequest());

        return $response->json();
    }

    public function sample(): array
    {
        return [
        ];
    }
}
