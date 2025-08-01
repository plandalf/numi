<?php

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Models\Automation\Sequence;
use App\Models\Automation\Run;
use App\Models\WorkflowStep;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Workflow\Serializers\Serializer;

class WorkflowsController extends Controller
{
    public function index(Request $request, Authenticatable $user): JsonResponse
    {
        $validated = $request->validate([
            'sequence_id' => 'required|integer|exists:automation_sequences,id',
            'limit' => 'sometimes|integer|min:1|max:100'
        ]);

        $sequence = Sequence::query()
            ->where('organization_id', $user->currentOrganization->id)
            ->findOrFail($validated['sequence_id']);

        $limit = $validated['limit'] ?? 20;

        $workflows = $sequence
            ->runs()
            ->with(['triggerEvent', 'sequence'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $formattedWorkflows = $workflows->map(function (Run $workflow) {
            // Get workflow steps
            $steps = WorkflowStep::query()
                ->where('run_id', $workflow->id)
                ->with('action:id,name,type,app_id')
                ->orderBy('created_at', 'asc')
                ->get();

            // Get workflow logs from the workflow package
            $logs = collect($workflow->logs)->map(function ($log) {
                return [
                    'id' => $log->id,
                    'created_at' => $log->created_at,
                    'class' => $log->class,
                    'content' => $log->result ? Serializer::unserialize($log->result) : null,
                ];
            })->toArray();

            // Get workflow exceptions
            $exceptions = collect($workflow->exceptions)->map(function ($exception) {
                return Serializer::unserialize($exception->exception);
            })->toArray();

            return [
                'id' => $workflow->id,
                'status' => $workflow->status,
                'created_at' => $workflow->created_at,

                // 'started_at' => $workflow->started_at,
                // 'finished_at' => $workflow->finished_at,

                'arguments' => $workflow->arguments ? Serializer::unserialize($workflow->arguments) : null,
                'output' => $workflow->output ? Serializer::unserialize($workflow->output) : null,
                'event' => $workflow->triggerEvent ? [
                    'id' => $workflow->triggerEvent->id,
                    'event_source' => $workflow->triggerEvent->event_source ?? null,
                    'event_data' => $workflow->triggerEvent->event_data ?? null,
                ] : null,
                'steps' => $steps->map(function (WorkflowStep $step) {
                    return [
                        'id' => $step->id,
                        'node_id' => $step->node_id,
                        'node_name' => $step->node_name ?? $step->step_name,
                        'node_type' => $step->node->type ?? 'unknown',
                        'status' => $step->status,
                        'started_at' => $step->started_at,
                        'completed_at' => $step->completed_at,
                        'duration_ms' => $step->duration_ms,
                        'input_data' => $step->input_data,
                        'output_data' => $step->output_data,
                        'raw_response' => $step->raw_response,
                        'error_message' => $step->error_message,
                        'error_code' => $step->error_code,
                        'retry_count' => $step->retry_count,
                    ];
                })->toArray(),
                'logs' => $logs,
                'exceptions' => $exceptions,
                'total_steps' => $steps->count(),
                'completed_steps' => $steps->where('status', WorkflowStep::STATUS_COMPLETED)->count(),
                'failed_steps' => $steps->where('status', WorkflowStep::STATUS_FAILED)->count(),
            ];
        });

        return response()->json([
            'data' => $formattedWorkflows,
            'sequence' => [
                'id' => $sequence->id,
                'name' => $sequence->name,
                'total_runs' => $sequence->runs()->count(),
            ]
        ]);
    }

    public function show(Request $request, int $workflowId): JsonResponse
    {
        $workflow = Run::with(['triggerEvent', 'sequence'])->findOrFail($workflowId);

        // Verify workflow belongs to user's organization sequence
        if ($workflow->sequence->organization_id !== auth()->user()->currentOrganization->id) {
            return response()->json(['message' => 'Workflow not found'], 404);
        }

        // Get detailed workflow steps
        $steps = WorkflowStep::where('run_id', $workflow->id)
            ->with(['action' => function($query) {
                $query->select('id', 'name', 'type', 'app_id', 'action_key')
                      ->with('app:id,name,icon_url,color');
            }])
            ->orderBy('created_at', 'asc')
            ->get();

        // Get workflow logs
        $logs = collect($workflow->logs)->map(function ($log) {
            return [
                'id' => $log->id,
                'created_at' => $log->created_at,
                'class' => $log->class,
                'content' => $log->result ? Serializer::unserialize($log->result) : null,
            ];
        })->toArray();

        // Get workflow exceptions
        $exceptions = collect($workflow->exceptions)->map(function ($exception) {
            return [
                'message' => $exception->exception ? Serializer::unserialize($exception->exception) : 'Unknown error',
                'created_at' => $exception->created_at,
            ];
        })->toArray();

        return response()->json([
            'data' => [
                'id' => $workflow->id,
                'status' => $workflow->status,
                'created_at' => $workflow->created_at,
                // 'started_at' => $workflow->started_at,
                // 'finished_at' => $workflow->finished_at,
                'arguments' => $workflow->arguments ? Serializer::unserialize($workflow->arguments) : null,
                'output' => $workflow->output ? Serializer::unserialize($workflow->output) : null,
                'event' => $workflow->triggerEvent ? [
                    'id' => $workflow->triggerEvent->id,
                    'event_source' => $workflow->triggerEvent->event_source ?? null,
                    'event_data' => $workflow->triggerEvent->event_data ?? null,
                    'created_at' => $workflow->triggerEvent->created_at,
                ] : null,
                'sequence' => [
                    'id' => $workflow->sequence->id,
                    'name' => $workflow->sequence->name,
                ],
                'steps' => $steps->map(function (WorkflowStep $step) {
                    return [
                        'id' => $step->id,
                        'node_id' => $step->node_id,
                        'node_name' => $step->node_name ?? $step->step_name,
                        'node_type' => $step->node->type ?? 'unknown',
                        'status' => $step->status,
                        'started_at' => $step->started_at,
                        'completed_at' => $step->completed_at,
                        'duration_ms' => $step->duration_ms,
                        'input_data' => $step->input_data,
                        'output_data' => $step->output_data,
                        'raw_response' => $step->raw_response,
                        'processed_output' => $step->processed_output,
                        'error_message' => $step->error_message,
                        'error_code' => $step->error_code,
                        'retry_count' => $step->retry_count,
                        'debug_info' => $step->debug_info,
                        'node' => $step->node ? [
                            'id' => $step->node->id,
                            'name' => $step->node->name,
                            'type' => $step->node->type,
                            'action_key' => $step->node->action_key,
                            'app' => $step->node->app ? [
                                'id' => $step->node->app->id,
                                'name' => $step->node->app->name,
                                'icon_url' => $step->node->app->icon_url,
                                'color' => $step->node->app->color,
                            ] : null
                        ] : null,
                    ];
                })->toArray(),
                'logs' => $logs,
                'exceptions' => $exceptions,
                'summary' => [
                    'total_steps' => $steps->count(),
                    'completed_steps' => $steps->where('status', WorkflowStep::STATUS_COMPLETED)->count(),
                    'failed_steps' => $steps->where('status', WorkflowStep::STATUS_FAILED)->count(),
                    'total_duration_ms' => $steps->sum('duration_ms'),
                    'avg_step_duration_ms' => $steps->count() > 0 ? round($steps->avg('duration_ms'), 2) : 0,
                ]
            ]
        ]);
    }
}
