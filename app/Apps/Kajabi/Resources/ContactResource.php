<?php

namespace App\Apps\Kajabi\Resources;

use App\Apps\Kajabi\KajabiApp;
use App\Apps\Kajabi\Requests\GetContactsRequest;
use App\Models\Integration;
use App\Workflows\Attributes\IsResource;
use App\Workflows\Automation\Resource as BaseResource;

#[IsResource(
    key: 'contact',
    noun: 'Contact',
    label: 'Contact',
    description: 'Kajabi contacts'
)]
class ContactResource extends BaseResource
{
    public function getValueLabelFields(): array
    {
        return [
            'value' => 'id',
            'label' => 'name',
        ];
    }

    public function search(array $query = []): array
    {
        $kajabiApp = new KajabiApp();
        $connector = $kajabiApp->auth($this->integration);

        $request = new GetContactsRequest();

        // Add search filter if provided
        if (!empty($query['search'])) {
            $request->query()->add('filter[email_cont]', $query['search']);
        }

        $response = $connector->send($request);

        if ($response->failed()) {
            throw new \Exception('Failed to fetch contacts from Kajabi: ' . $response->body());
        }

        $data = $response->json('data', []);

        // Format for frontend
        return array_map(function ($contact) {
            $email = $contact['attributes']['email'] ?? 'No email';
            $firstName = $contact['attributes']['first_name'] ?? '';
            $lastName = $contact['attributes']['last_name'] ?? '';
            $name = trim($firstName . ' ' . $lastName);
            $displayName = $name ? "{$name} ({$email})" : $email;

            return [
                'value' => $contact['id'],
                'label' => $displayName,
                'data' => $contact,
            ];
        }, $data);
    }

    public function get(string $id): ?array
    {
        $kajabiApp = new KajabiApp();
        $connector = $kajabiApp->auth($this->integration);

        $request = new GetContactsRequest();
        $response = $connector->send($request);

        if ($response->failed()) {
            throw new \Exception('Failed to fetch contact from Kajabi: ' . $response->body());
        }

        $data = $response->json('data', []);

        // Find the specific contact by ID
        $contact = collect($data)->firstWhere('id', $id);

        if (!$contact) {
            return null;
        }

        return [
            'value' => $contact['id'],
            'label' => $contact['attributes']['email'] ?? 'Contact',
            'data' => $contact,
        ];
    }

    public static function getDefinition(): array
    {
        return [
            'key' => 'contact',
            'name' => 'Contact',
            'description' => 'Kajabi contacts/members',
        ];
    }
}
