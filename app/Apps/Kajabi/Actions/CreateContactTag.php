<?php

namespace App\Apps\Kajabi\Actions;

use App\Apps\Kajabi\KajabiApp;
use App\Apps\Kajabi\Requests\AddTagsToContactRequest;
use App\Apps\Kajabi\Requests\CreateTagRequest;
use App\Apps\Kajabi\Requests\FindTagByNameRequest;
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
            Field::string('name', 'Tag Name')
                ->required()->help('The tag\'s name.')
                ->help('Multiple, Comma separated Names will create multiple tags.'),
            Field::string('contact_id', 'Contact ID')
                ->required()
                ->help('the contact to tag'),
        ];
    }

    /**
     * @param Bundle{input: array{name: string, contact_id: string}} $bundle
     */
    public function __invoke(Bundle $bundle): array
    {
        $kajabi = new KajabiApp();
        $connector = $kajabi->auth($bundle->integration);

        $tagName = $bundle->input['name'];
        $contactId = $bundle->input['contact_id'];
        $siteId = $bundle->integration->connection_config['site_id'] ?? null;

        // First, try to find existing tag by name
        $findTagRequest = new FindTagByNameRequest($tagName, $siteId);
        $findTagResponse = $connector->send($findTagRequest);

        if ($findTagResponse->failed()) {
            throw new \Exception('Failed to search for tags in Kajabi: ' . $findTagResponse->body());
        }

        $existingTags = $findTagResponse->json('data', []);
        $tagId = null;

        // If tag exists, use it
        if (!empty($existingTags)) {
            $tag = collect($existingTags)->firstWhere('attributes.name', $tagName);
            $tagId = $tag['id'];
            $action = 'found';
        } else {
            // Tag doesn't exist, create it
//            $createTagRequest = new CreateTagRequest($tagName, $siteId);
//            $createTagResponse = $connector->send($createTagRequest);

            throw new \Exception('Failed to create tag in Kajabi: ');
            // . $createTagResponse->body()
//            if ($createTagResponse->failed()) {
//            }

            $newTag = $createTagResponse->json('data');
            $tagId = $newTag['id'];
            $action = 'created';
        }

        // Now add the tag to the contact
        $addTagRequest = new AddTagsToContactRequest($contactId, [$tagId]);
        $addTagResponse = $connector->send($addTagRequest);

        if ($addTagResponse->failed()) {
            throw new \Exception('Failed to add tag to contact in Kajabi: ' . $addTagResponse->body());
        }

        return [
            'tag_id' => $tagId,
            'tag_name' => $tagName,
            'contact_id' => $contactId,
            'site_id' => $siteId,
            'tag_action' => $action,
            'status' => 'assigned',
            'created_at' => now()->toISOString(),
            'message' => "Tag '{$tagName}' {$action} and assigned to contact successfully",
        ];
    }

    public function sample(): array
    {
        return [
            'tag_id' => '789',
            'tag_name' => 'VIP Customer',
            'contact_id' => '12345',
            'site_id' => 'your-kajabi-site',
            'tag_action' => 'created',
            'status' => 'assigned',
            'created_at' => now()->toISOString(),
            'message' => "Tag 'VIP Customer' created and assigned to contact successfully",
        ];
    }
}
