<?php

namespace App\Http\Controllers;

use App\Models\ReusableBlock;
use Illuminate\Http\Request;

class ReusableBlockController extends Controller
{
    public function index(Request $request)
    {
        $organizationId = $request->user()->current_organization_id;
        $query = ReusableBlock::forOrganization($organizationId);
        if ($request->filled('search')) {
            $query->search($request->search);
        }
        $blocks = $query->orderBy('name')->paginate(20);
        return response()->json($blocks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'block_type' => 'required|string|max:50',
            'configuration' => 'required|array',
        ]);
        $organizationId = $request->user()->current_organization_id;
        $configuration = $validated['configuration'];
        unset($configuration['id']);
        $reusableBlock = ReusableBlock::create([
            'organization_id' => $organizationId,
            'name' => $validated['name'],
            'block_type' => $validated['block_type'],
            'configuration' => $configuration,
        ]);
        return response()->json($reusableBlock, 201);
    }

    public function destroy(Request $request, ReusableBlock $reusableBlock)
    {
        $this->authorizeOrganizationAccess($request, $reusableBlock);
        $reusableBlock->delete();
        return response()->json(['message' => 'Block deleted successfully']);
    }

    public function use(Request $request, ReusableBlock $reusableBlock)
    {
        $this->authorizeOrganizationAccess($request, $reusableBlock);
        $configuration = $reusableBlock->getBlockConfiguration();
        $configuration['id'] = $this->generateBlockId($configuration['type']);
        return response()->json(['configuration' => $configuration]);
    }

    private function authorizeOrganizationAccess(Request $request, ReusableBlock $reusableBlock): void
    {
        if ($reusableBlock->organization_id !== $request->user()->current_organization_id) {
            abort(403, 'Unauthorized access to this reusable block');
        }
    }

    private function generateBlockId(string $blockType): string
    {
        $timestamp = now()->getTimestamp();
        $random = rand(1000, 9999);
        $camelCaseType = collect(explode('_', $blockType))
            ->map(fn($word, $index) => $index === 0 ? strtolower($word) : ucfirst(strtolower($word)))
            ->join('');
        return "{$camelCaseType}_{$timestamp}_{$random}";
    }
} 