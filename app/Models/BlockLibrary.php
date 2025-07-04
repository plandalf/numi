<?php

namespace App\Models;

use App\Database\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property string|null $description
 * @property string $block_type
 * @property string|null $category
 * @property array $configuration
 * @property string|null $preview_image_url
 * @property array|null $tags
 * @property int $usage_count
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class BlockLibrary extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'block_libraries';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'block_type',
        'category',
        'configuration',
        'preview_image_url',
        'tags',
        'usage_count',
    ];

    protected $casts = [
        'configuration' => 'json',
        'tags' => 'array',
        'usage_count' => 'integer',
    ];

    protected $attributes = [
        'usage_count' => 0,
    ];

    /**
     * Get the organization that owns the block library item.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope a query to only include blocks for a specific organization.
     */
    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Scope a query to only include blocks of a specific type.
     */
    public function scopeOfType(Builder $query, string $blockType): Builder
    {
        return $query->where('block_type', $blockType);
    }

    /**
     * Scope a query to only include blocks in a specific category.
     */
    public function scopeInCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Scope a query to search blocks by name or description.
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $query) use ($search) {
            $query->where('name', 'ILIKE', "%{$search}%")
                ->orWhere('description', 'ILIKE', "%{$search}%");
        });
    }

    /**
     * Scope a query to order blocks by usage count.
     */
    public function scopePopular(Builder $query): Builder
    {
        return $query->orderBy('usage_count', 'desc');
    }

    /**
     * Scope a query to order blocks by most recently created.
     */
    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Increment the usage count for this block.
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Get the block configuration as a properly formatted block object.
     */
    public function getBlockConfiguration(): array
    {
        return array_merge($this->configuration, [
            'type' => $this->block_type,
            'object' => 'block',
        ]);
    }

    /**
     * Check if this block has the specified tag.
     */
    public function hasTag(string $tag): bool
    {
        return in_array($tag, $this->tags ?? []);
    }

    /**
     * Add a tag to this block if it doesn't already exist.
     */
    public function addTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->update(['tags' => $tags]);
        }
    }

    /**
     * Remove a tag from this block.
     */
    public function removeTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tags = array_filter($tags, fn($t) => $t !== $tag);
        $this->update(['tags' => array_values($tags)]);
    }
}
