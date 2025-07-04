<?php

namespace App\Http\Controllers;

use App\Models\BlockLibrary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BlockLibraryController extends Controller
{
    /**
     * Display a listing of block library items for the current organization.
     */
    public function index(Request $request)
    {
        $organizationId = $request->user()->current_organization_id;
        
        $query = BlockLibrary::forOrganization($organizationId);

        // Apply filters
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('category')) {
            $query->inCategory($request->category);
        }

        if ($request->filled('block_type')) {
            $query->ofType($request->block_type);
        }

        // Apply sorting
        $sortBy = $request->get('sort', 'recent');
        switch ($sortBy) {
            case 'popular':
                $query->popular();
                break;
            case 'name':
                $query->orderBy('name');
                break;
            case 'recent':
            default:
                $query->recent();
                break;
        }

        $blocks = $query->paginate(20);

        return response()->json($blocks);
    }

    /**
     * Store a newly created block library item.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'block_type' => 'required|string|max:50',
            'category' => 'nullable|string|max:100',
            'configuration' => 'required|array',
            'preview_image_url' => 'nullable|url|max:500',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        $organizationId = $request->user()->current_organization_id;

        // Ensure the configuration has the required structure
        $configuration = $validated['configuration'];
        
        // Remove ID from configuration as we'll generate a new one when used
        unset($configuration['id']);

        $blockLibrary = BlockLibrary::create([
            'organization_id' => $organizationId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'block_type' => $validated['block_type'],
            'category' => $validated['category'] ?? null,
            'configuration' => $configuration,
            'preview_image_url' => $validated['preview_image_url'] ?? null,
            'tags' => $validated['tags'] ?? [],
        ]);

        return response()->json($blockLibrary, 201);
    }

    /**
     * Display the specified block library item.
     */
    public function show(Request $request, BlockLibrary $blockLibrary)
    {
        // Ensure the block belongs to the current organization
        $this->authorizeOrganizationAccess($request, $blockLibrary);

        return response()->json($blockLibrary);
    }

    /**
     * Update the specified block library item.
     */
    public function update(Request $request, BlockLibrary $blockLibrary)
    {
        // Ensure the block belongs to the current organization
        $this->authorizeOrganizationAccess($request, $blockLibrary);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:100',
            'configuration' => 'sometimes|array',
            'preview_image_url' => 'nullable|url|max:500',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        // Remove ID from configuration if updating it
        if (isset($validated['configuration'])) {
            unset($validated['configuration']['id']);
        }

        $blockLibrary->update($validated);

        return response()->json($blockLibrary);
    }

    /**
     * Remove the specified block library item from storage.
     */
    public function destroy(Request $request, BlockLibrary $blockLibrary)
    {
        // Ensure the block belongs to the current organization
        $this->authorizeOrganizationAccess($request, $blockLibrary);

        $blockLibrary->delete();

        return response()->json(['message' => 'Block deleted successfully']);
    }

    /**
     * Duplicate a block library item.
     */
    public function duplicate(Request $request, BlockLibrary $blockLibrary)
    {
        // Ensure the block belongs to the current organization
        $this->authorizeOrganizationAccess($request, $blockLibrary);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
        ]);

        $newBlock = $blockLibrary->replicate();
        $newBlock->name = $validated['name'] ?? $blockLibrary->name . ' (Copy)';
        $newBlock->usage_count = 0;
        $newBlock->save();

        return response()->json($newBlock, 201);
    }

    /**
     * Use a block library item (increment usage count and return configuration).
     */
    public function use(Request $request, BlockLibrary $blockLibrary)
    {
        // Ensure the block belongs to the current organization
        $this->authorizeOrganizationAccess($request, $blockLibrary);

        // Increment usage count
        $blockLibrary->incrementUsage();

        // Return the block configuration with a new unique ID
        $configuration = $blockLibrary->getBlockConfiguration();
        $configuration['id'] = $this->generateBlockId($configuration['type']);

        return response()->json(['configuration' => $configuration]);
    }

    /**
     * Get categories for the current organization.
     */
    public function categories(Request $request)
    {
        $organizationId = $request->user()->current_organization_id;

        $categories = BlockLibrary::forOrganization($organizationId)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->values();

        return response()->json(['categories' => $categories]);
    }

    /**
     * Get block types for the current organization.
     */
    public function blockTypes(Request $request)
    {
        $organizationId = $request->user()->current_organization_id;

        $blockTypes = BlockLibrary::forOrganization($organizationId)
            ->distinct()
            ->pluck('block_type')
            ->values();

        return response()->json(['block_types' => $blockTypes]);
    }

    /**
     * Ensure the user has access to the block library item.
     */
    private function authorizeOrganizationAccess(Request $request, BlockLibrary $blockLibrary): void
    {
        if ($blockLibrary->organization_id !== $request->user()->current_organization_id) {
            abort(403, 'Unauthorized access to this block library item');
        }
    }

    /**
     * Generate a unique block ID.
     */
    private function generateBlockId(string $blockType): string
    {
        $timestamp = now()->getTimestamp();
        $random = rand(1000, 9999);
        
        // Convert to camelCase
        $camelCaseType = collect(explode('_', $blockType))
            ->map(fn($word, $index) => $index === 0 ? strtolower($word) : ucfirst(strtolower($word)))
            ->join('');

        return "{$camelCaseType}_{$timestamp}_{$random}";
    }
}
