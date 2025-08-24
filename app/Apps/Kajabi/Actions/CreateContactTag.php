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
                ->help('Use commas to separate multiple tags. Tags with spaces must be wrapped in double quotes, e.g. "VIP Customer", Promo.'),
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

        $rawTagInput = $bundle->input['name'];
        $contactId = $bundle->input['contact_id'];
        $siteId = $bundle->integration->connection_config['site_id'] ?? null;

        // Parse tag input supporting comma-separated list with double-quoted values for spaces
        [$tagNames, $wasQuotedMap] = $this->parseTagNames($rawTagInput);

        // Enforce quotes for tags that include spaces
        foreach ($tagNames as $index => $name) {
            if (preg_match('/\s/', $name) === 1 && ($wasQuotedMap[$index] ?? false) === false) {
                throw new \InvalidArgumentException('Tag names containing spaces must be wrapped in double quotes. Offending tag: ' . $name);
            }
        }

        // Resolve tag IDs from Kajabi (must already exist)
        $resolvedTagIds = [];
        $resolvedTags = [];

        // Use unique names to avoid duplicate requests while preserving original order
        $seen = [];
        foreach ($tagNames as $name) {
            if (isset($seen[$name])) {
                continue;
            }
            $seen[$name] = true;

            $findTagRequest = new FindTagByNameRequest($name, $siteId);
            $findTagResponse = $connector->send($findTagRequest);

            if ($findTagResponse->failed()) {
                throw new \Exception('Failed to search for tags in Kajabi: ' . $findTagResponse->body());
            }

            $existingTags = $findTagResponse->json('data', []);
            if (!empty($existingTags)) {
                $tag = collect($existingTags)->firstWhere('attributes.name', $name);
                if (!$tag) {
                    throw new \RuntimeException('Tag not found in Kajabi: ' . $name);
                }
                $resolvedTagIds[] = $tag['id'];
                $resolvedTags[] = [
                    'id' => $tag['id'],
                    'name' => $name,
                    'action' => 'found',
                ];
            } else {
                // Creation is not implemented; enforce existing tags only for now
                throw new \RuntimeException('Tag not found in Kajabi: ' . $name . '. Creating tags is not currently supported by this action.');
            }
        }

        // Now add all tags to the contact in one request
        $addTagRequest = new AddTagsToContactRequest($contactId, $resolvedTagIds);
        $addTagResponse = $connector->send($addTagRequest);

        if ($addTagResponse->failed()) {
            throw new \Exception('Failed to add tag to contact in Kajabi: ' . $addTagResponse->body());
        }

        // Backward-compatible fields for single-tag usage, plus array forms for multi-tag usage
        $firstTag = $resolvedTags[0] ?? null;

        return [
            'tag_id' => $firstTag['id'] ?? null,
            'tag_name' => $firstTag['name'] ?? null,
            'tag_ids' => $resolvedTagIds,
            'tag_names' => array_map(fn($t) => $t['name'], $resolvedTags),
            'tags' => $resolvedTags,
            'contact_id' => $contactId,
            'site_id' => $siteId,
            'tag_action' => $firstTag['action'] ?? 'found',
            'status' => 'assigned',
            'created_at' => now()->toISOString(),
            'message' => (count($resolvedTags) > 1)
                ? ("Tags '" . implode("', '", array_map(fn($t) => $t['name'], $resolvedTags)) . "' assigned to contact successfully")
                : ("Tag '" . ($firstTag['name'] ?? '') . "' found and assigned to contact successfully"),
        ];
    }

    /**
     * Parses a comma-separated tag list supporting double quotes for values containing spaces.
     * Returns an array: [array $names, array $wasQuotedByIndex].
     *
     * Examples:
     *  - Foo, Bar => ['Foo','Bar'] (no quotes)
     *  - "VIP Customer", Promo => ['VIP Customer','Promo'] (first quoted)
     */
    private function parseTagNames(string $input): array
    {
        $names = [];
        $wasQuoted = [];
        $length = strlen($input);

        $current = '';
        $inQuotes = false;
        $currentWasQuoted = false;

        for ($i = 0; $i < $length; $i++) {
            $char = $input[$i];

            if ($inQuotes) {
                if ($char === '"') {
                    // Support escaped double quote by doubling ""
                    $nextChar = $i + 1 < $length ? $input[$i + 1] : null;
                    if ($nextChar === '"') {
                        $current .= '"';
                        $i++; // skip escaped quote
                        continue;
                    }
                    $inQuotes = false;
                    continue;
                }
                $current .= $char;
                continue;
            }

            if ($char === '"') {
                $inQuotes = true;
                $currentWasQuoted = true;
                continue;
            }

            if ($char === ',') {
                $value = trim($current);
                if ($value !== '') {
                    $names[] = $value;
                    $wasQuoted[] = $currentWasQuoted;
                }
                $current = '';
                $currentWasQuoted = false;
                continue;
            }

            $current .= $char;
        }

        if ($inQuotes) {
            throw new \InvalidArgumentException('Unmatched double quote in tag list.');
        }

        $value = trim($current);
        if ($value !== '') {
            $names[] = $value;
            $wasQuoted[] = $currentWasQuoted;
        }

        // Return values and a parallel map keyed by original index
        $indexMap = [];
        foreach ($wasQuoted as $idx => $q) {
            $indexMap[$idx] = $q;
        }

        return [$names, $indexMap];
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
