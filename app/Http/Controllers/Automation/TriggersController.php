<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Models\Automation\Sequence;
use App\Models\Automation\Node;
use App\Models\Automation\Trigger;
use App\Models\App;

class TriggersController extends Controller
{
    /**
     * Store a newly created trigger.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => 'required|integer|exists:automation_sequences,id',
            'app_id' => 'required|integer|exists:apps,id',
            'trigger_id' => 'required|string',
            'name' => 'required|string|max:255',
            'configuration' => 'nullable|array',
        ]);

        try {
            $sequence = Sequence::findOrFail($validated['sequence_id']);
            $app = App::findOrFail($validated['app_id']);

            $trigger = Trigger::create([
                'sequence_id' => $sequence->id,
                'name' => $validated['name'],
                'app_id' => $app->id,
                'trigger_key' => $validated['trigger_id'],
                'configuration' => $validated['configuration'] ?? [],
            ]);

            return response()->json([
                'data' => $trigger,
                'message' => 'Trigger created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create trigger: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified trigger.
     */
    public function show(int $id): Response
    {
        // TODO: Implement trigger show
        return response()->noContent();
    }

    /**
     * Update the specified trigger.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'configuration' => 'nullable|array',
        ]);

        try {
            $trigger = Trigger::findOrFail($id);
            $trigger->update([
                'name' => $validated['name'],
                'configuration' => $validated['configuration'] ?? [],
            ]);

            return response()->json([
                'data' => $trigger,
                'message' => 'Trigger updated successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update trigger: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified trigger.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $trigger = Trigger::findOrFail($id);
            $trigger->delete();

            return response()->json([
                'message' => 'Trigger deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete trigger: ' . $e->getMessage()
            ], 500);
        }
    }
}
