<?php

namespace App\Apps\Kajabi\Actions;

use App\Apps\Kajabi\KajabiApp;
use App\Apps\Kajabi\Requests\CreateContactRequest;
use App\Apps\Kajabi\Requests\FindContactByEmailRequest;
use App\Workflows\Attributes\IsAction;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;

#[IsAction(
    key: 'find_or_create_contact',
    noun: 'Contact',
    label: 'Find or Create Contact',
    description: 'Finds an existing contact by email or creates a new one if not found.',
    type: 'create'
)]
class FindOrCreateContact extends AppAction
{
    public static function props(): array
    {
        return [
            Field::string('email', 'Email Address')
                ->required()
                ->help('The contact\'s email address.'),
            Field::string('first_name', 'First Name')
                ->optional()
                ->help('The contact\'s first name (used when creating a new contact).'),
            Field::string('last_name', 'Last Name')
                ->optional()
                ->help('The contact\'s last name (used when creating a new contact).'),
        ];
    }

    /**
     * @param Bundle{input: array{email: string, first_name?: string, last_name?: string, tags?: string}} $bundle
     */
    public function __invoke(Bundle $bundle): array
    {
        $kajabi = new KajabiApp();
        $connector = $kajabi->auth($bundle->integration);

        $email = $bundle->input['email'];
        $siteId = $bundle->integration->connection_config['site_id'] ?? null;

        // First, try to find existing contact by email
        $findRequest = new FindContactByEmailRequest($email, $siteId);
        $findResponse = $connector->send($findRequest);

        if ($findResponse->failed()) {
            throw new \Exception('Failed to search for contacts in Kajabi: ' . $findResponse->body());
        }

        $existingContacts = $findResponse->json('data', []);

        // If contact exists, return it
        if (!empty($existingContacts)) {
            $contact = $existingContacts[0];

            if (!isset($contact['attributes']['email']) || $contact['attributes']['email'] !== $email) {
                throw new \Exception('Found contact does not match the provided email address.');
            }

            return [
                'contact_id' => $contact['id'],
                'email' => $contact['attributes']['email'],
                'first_name' => $contact['attributes']['first_name'] ?? null,
                'last_name' => $contact['attributes']['last_name'] ?? null,
                'name' => $contact['attributes']['name'] ?? null,
                'site_id' => $siteId,
                'action' => 'found',
                'created_at' => $contact['attributes']['created_at'] ?? null,
                'message' => 'Contact found successfully',
            ];
        }

        // Contact doesn't exist, create a new one
        $contactData = [
            'email' => $email,
        ];

        // Build the name field from first_name and last_name
        $nameParts = [];
        if (!empty($bundle->input['first_name'])) {
            $contactData['first_name'] = $bundle->input['first_name'];
            $nameParts[] = $bundle->input['first_name'];
        }

        if (!empty($bundle->input['last_name'])) {
            $contactData['last_name'] = $bundle->input['last_name'];
            $nameParts[] = $bundle->input['last_name'];
        }

        // Set the name field as required by Kajabi API
        if (!empty($nameParts)) {
            $contactData['name'] = implode(' ', $nameParts);
        } else {
            // If no name provided, use email as name
            $contactData['name'] = $email;
        }

        $createRequest = new CreateContactRequest($contactData, $siteId);
        $createResponse = $connector->send($createRequest);

        if ($createResponse->failed()) {
            throw new \Exception('Failed to create contact in Kajabi: ' . $createResponse->body());
        }

        $newContact = $createResponse->json('data');

        return [
            'contact_id' => $newContact['id'],
            'email' => $newContact['attributes']['email'],
            'first_name' => $newContact['attributes']['first_name'] ?? null,
            'last_name' => $newContact['attributes']['last_name'] ?? null,
            'name' => $newContact['attributes']['name'] ?? null,
            'site_id' => $siteId,
            'action' => 'created',
            'created_at' => $newContact['attributes']['created_at'] ?? null,
            'message' => 'Contact created successfully',
        ];
    }

    public function sample(): array
    {
        return [
            'contact_id' => '12345',
            'email' => 'john.doe@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'name' => 'John Doe',
            'site_id' => 'your-kajabi-site',
            'action' => 'created',
            'created_at' => now()->toISOString(),
            'message' => 'Contact created successfully',
        ];
    }
}
