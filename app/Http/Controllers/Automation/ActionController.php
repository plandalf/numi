<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Models\Automation\Node;
use App\Models\Automation\Sequence;
use App\Models\App;

class ActionController extends Controller
{
    /**
     * Display a listing of actions for a sequence.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => 'required|integer|exists:automation_sequences,id',
        ]);

        try {
            $sequence = Sequence::findOrFail($validated['sequence_id']);
            $actions = $sequence->nodes()->where('type', 'action')->get();

            return response()->json([
                'data' => $actions,
                'message' => 'Actions retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve actions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created action.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => 'required|integer|exists:automation_sequences,id',
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'app_action_key' => 'required|string',
            'app_name' => 'required|string',
            'configuration' => 'nullable|array',
        ]);

        try {
            $sequence = Sequence::findOrFail($validated['sequence_id']);
            
            // Find the app by name
            $app = App::where('name', $validated['app_name'])->first();
            if (!$app) {
                return response()->json([
                    'message' => 'App not found: ' . $validated['app_name']
                ], 404);
            }

            $action = Node::create([
                'sequence_id' => $sequence->id,
                'name' => $validated['name'],
                'type' => 'action',
                'app_id' => $app->id,
                'action_key' => $validated['app_action_key'],
                'configuration' => $validated['configuration'] ?? [],
                // 'position_x' => 0, // Default position
                // 'position_y' => 0, // Default position
            ]);

            return response()->json([
                'data' => $action->load('app'),
                'message' => 'Action created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create action: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified action.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $action = Node::where('id', $id)
                          ->where('type', 'action')
                          ->firstOrFail();

            return response()->json([
                'data' => $action->load('app'),
                'message' => 'Action retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve action: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified action.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'app_id' => 'sometimes|integer|exists:apps,id',
            'action_key' => 'sometimes|string',
            'configuration' => 'nullable|array',
        ]);

        try {
            $action = Node::where('id', $id)
                          ->where('type', 'action')
                          ->firstOrFail();

            $updateData = [
                'name' => $validated['name'],
                'configuration' => $validated['configuration'] ?? [],
            ];

            // Allow updating app_id and action_key if provided
            if (isset($validated['app_id'])) {
                $updateData['app_id'] = $validated['app_id'];
            }
            
            if (isset($validated['action_key'])) {
                $updateData['action_key'] = $validated['action_key'];
            }

            $action->update($updateData);

            return response()->json([
                'data' => $action->load('app'),
                'message' => 'Action updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update action: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test an action configuration
     */
    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => 'required|integer|exists:automation_sequences,id',
            'app_action_key' => 'required|string',
            'app_name' => 'required|string',
            'configuration' => 'nullable|array',
        ]);

        try {
            // Find the app by name
            $app = App::where('name', $validated['app_name'])->first();
            if (!$app) {
                return response()->json([
                    'message' => 'App not found: ' . $validated['app_name']
                ], 404);
            }

            // TODO: Implement actual action testing logic
            // For now, return a mock success response
            return response()->json([
                'success' => true,
                'message' => 'Action test completed successfully',
                'data' => [
                    'action_key' => $validated['app_action_key'],
                    'app_name' => $validated['app_name'],
                    'configuration' => $validated['configuration'] ?? [],
                    'test_result' => 'Mock test result - action would execute successfully',
                    'timestamp' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Action test failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Remove the specified action.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $action = Node::where('id', $id)
                          ->where('type', 'action')
                          ->firstOrFail();
            
            $action->delete();

            return response()->json([
                'message' => 'Action deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete action: ' . $e->getMessage()
            ], 500);
        }
    }
} 