<?php

namespace App\Services;

use App\Models\BlockLibrary;
use App\Models\Store\Offer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BlockLibraryService
{
    /**
     * Create a block library item from a configured block.
     */
    public function createFromBlock(
        array $blockConfiguration,
        string $name,
        int $organizationId,
        ?string $description = null,
        ?string $category = null,
        ?array $tags = null
    ): BlockLibrary {
        return DB::transaction(function () use ($blockConfiguration, $name, $organizationId, $description, $category, $tags) {
            // Clean the configuration by removing dynamic properties
            $cleanedConfiguration = $this->cleanBlockConfiguration($blockConfiguration);

            return BlockLibrary::create([
                'organization_id' => $organizationId,
                'name' => $name,
                'description' => $description,
                'block_type' => $blockConfiguration['type'],
                'category' => $category,
                'configuration' => $cleanedConfiguration,
                'tags' => $tags ?? [],
            ]);
        });
    }

    /**
     * Clean block configuration by removing properties that shouldn't be saved.
     */
    private function cleanBlockConfiguration(array $blockConfiguration): array
    {
        $cleaned = $blockConfiguration;

        // Remove properties that are dynamic and shouldn't be saved
        $keysToRemove = [
            'id', // Will be generated when block is used
            'name', // Block name is separate from block configuration
        ];

        foreach ($keysToRemove as $key) {
            unset($cleaned[$key]);
        }

        // Clean nested objects if they exist
        if (isset($cleaned['content']) && is_array($cleaned['content'])) {
            $cleaned['content'] = $this->cleanContentConfiguration($cleaned['content']);
        }

        if (isset($cleaned['style']) && is_array($cleaned['style'])) {
            $cleaned['style'] = $this->cleanStyleConfiguration($cleaned['style']);
        }

        if (isset($cleaned['appearance']) && is_array($cleaned['appearance'])) {
            $cleaned['appearance'] = $this->cleanAppearanceConfiguration($cleaned['appearance']);
        }

        return $cleaned;
    }

    /**
     * Clean content configuration.
     */
    private function cleanContentConfiguration(array $content): array
    {
        // Remove any temporary or computed values
        $keysToRemove = [
            '_computed',
            '_temporary',
        ];

        foreach ($keysToRemove as $key) {
            unset($content[$key]);
        }

        return $content;
    }

    /**
     * Clean style configuration.
     */
    private function cleanStyleConfiguration(array $style): array
    {
        // Remove computed or temporary style values
        $keysToRemove = [
            '_computed',
            '_temporary',
        ];

        foreach ($keysToRemove as $key) {
            unset($style[$key]);
        }

        return $style;
    }

    /**
     * Clean appearance configuration.
     */
    private function cleanAppearanceConfiguration(array $appearance): array
    {
        // Remove computed or temporary appearance values
        $keysToRemove = [
            '_computed',
            '_temporary',
        ];

        foreach ($keysToRemove as $key) {
            unset($appearance[$key]);
        }

        return $appearance;
    }

    /**
     * Generate a ready-to-use block configuration from a library item.
     */
    public function generateBlockFromLibrary(BlockLibrary $blockLibrary): array
    {
        $configuration = $blockLibrary->getBlockConfiguration();
        
        // Generate a unique ID for the new block instance
        $configuration['id'] = $this->generateUniqueBlockId($blockLibrary->block_type);

        return $configuration;
    }

    /**
     * Generate a unique block ID.
     */
    private function generateUniqueBlockId(string $blockType): string
    {
        $timestamp = now()->getTimestamp();
        $random = rand(1000, 9999);
        
        // Convert snake_case to camelCase
        $camelCaseType = collect(explode('_', $blockType))
            ->map(fn($word, $index) => $index === 0 ? strtolower($word) : ucfirst(strtolower($word)))
            ->join('');

        return "{$camelCaseType}_{$timestamp}_{$random}";
    }

    /**
     * Get popular block library items for an organization.
     */
    public function getPopularBlocks(int $organizationId, int $limit = 10): Collection
    {
        return BlockLibrary::forOrganization($organizationId)
            ->popular()
            ->take($limit)
            ->get();
    }

    /**
     * Get recent block library items for an organization.
     */
    public function getRecentBlocks(int $organizationId, int $limit = 10): Collection
    {
        return BlockLibrary::forOrganization($organizationId)
            ->recent()
            ->take($limit)
            ->get();
    }

    /**
     * Search block library items.
     */
    public function searchBlocks(int $organizationId, string $query, ?array $filters = null): Collection
    {
        $blockQuery = BlockLibrary::forOrganization($organizationId);

        if (!empty($query)) {
            $blockQuery->search($query);
        }

        if (isset($filters['category'])) {
            $blockQuery->inCategory($filters['category']);
        }

        if (isset($filters['block_type'])) {
            $blockQuery->ofType($filters['block_type']);
        }

        if (isset($filters['tags']) && is_array($filters['tags'])) {
            foreach ($filters['tags'] as $tag) {
                $blockQuery->whereJsonContains('tags', $tag);
            }
        }

        return $blockQuery->recent()->get();
    }

    /**
     * Bulk update block library items.
     */
    public function bulkUpdate(array $blockIds, array $data, int $organizationId): int
    {
        return BlockLibrary::forOrganization($organizationId)
            ->whereIn('id', $blockIds)
            ->update($data);
    }

    /**
     * Get block usage statistics for an organization.
     */
    public function getUsageStatistics(int $organizationId): array
    {
        $blocks = BlockLibrary::forOrganization($organizationId)->get();

        $totalBlocks = $blocks->count();
        $totalUsage = $blocks->sum('usage_count');
        $averageUsage = $totalBlocks > 0 ? round($totalUsage / $totalBlocks, 2) : 0;

        $byCategory = $blocks->groupBy('category')->map(function ($categoryBlocks) {
            return [
                'count' => $categoryBlocks->count(),
                'total_usage' => $categoryBlocks->sum('usage_count'),
            ];
        });

        $byType = $blocks->groupBy('block_type')->map(function ($typeBlocks) {
            return [
                'count' => $typeBlocks->count(),
                'total_usage' => $typeBlocks->sum('usage_count'),
            ];
        });

        return [
            'total_blocks' => $totalBlocks,
            'total_usage' => $totalUsage,
            'average_usage' => $averageUsage,
            'by_category' => $byCategory,
            'by_type' => $byType,
            'most_used' => $blocks->sortByDesc('usage_count')->take(5)->values(),
        ];
    }

    /**
     * Validate block configuration before saving.
     */
    public function validateBlockConfiguration(array $configuration): array
    {
        $errors = [];

        // Check required fields
        if (!isset($configuration['type'])) {
            $errors[] = 'Block type is required';
        }

        if (!isset($configuration['object'])) {
            $errors[] = 'Block object type is required';
        }

        // Validate block type exists
        if (isset($configuration['type'])) {
            $validTypes = $this->getValidBlockTypes();
            if (!in_array($configuration['type'], $validTypes)) {
                $errors[] = "Invalid block type: {$configuration['type']}";
            }
        }

        return $errors;
    }

    /**
     * Get list of valid block types.
     * This could be extended to dynamically get types from your block system.
     */
    private function getValidBlockTypes(): array
    {
        return [
            'text',
            'heading',
            'button',
            'image',
            'video',
            'divider',
            'spacer',
            'text_input',
            'email_input',
            'checkbox',
            'radio',
            'select',
            'textarea',
            'file_upload',
            'payment_button',
            'checkout_summary',
            'stripe_elements',
        ];
    }
} 