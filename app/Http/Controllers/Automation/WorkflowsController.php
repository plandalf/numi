<?php

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use App\Models\Automation\Sequence;
use App\Models\Automation\Run;
use App\Models\WorkflowStep;
use App\Workflows\RunSequenceWorkflow;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Workflow\Serializers\Serializer;
use Workflow\WorkflowStub;

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
            ->with(['event', 'sequence'])
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

            // Get workflow logs from the workflow package (latest first)
            $logsCollection = collect($workflow->logs);
            $logs = $logsCollection
                ->sortByDesc(function ($log) {
                    return $log->created_at;
                })
                ->values()
                ->map(function ($log) {
                    try {
                        return [
                            'id' => $log->id,
                            'created_at' => $log->created_at,
                            'class' => $log->class,
                            'content' => $log->result ? Serializer::unserialize($log->result) : null,
                        ];
                    } catch (\Throwable $e) {
                        return null;
                    }
                })
                ->filter()
                ->toArray();

            // Get workflow exceptions (latest first)
            $exceptionsCollection = collect($workflow->exceptions);
            $exceptions = $exceptionsCollection
                ->sortByDesc(function ($e) {
                    return $e->created_at;
                })
                ->values()
                ->map(function ($exception) {
                    try {
                        return Serializer::unserialize($exception->exception);
                    } catch (\Throwable $e) {
                        return null;
                    }
                })
                ->filter()
                ->toArray();

            return [
                'id' => $workflow->id,
                'status' => $workflow->status,
                'created_at' => $workflow->created_at,

                // 'started_at' => $workflow->started_at,
                // 'finished_at' => $workflow->finished_at,

                'arguments' => value(function () use ($workflow) {
                    try {
                        return $workflow->arguments ? Serializer::unserialize($workflow->arguments) : null;
                    } catch (\Throwable $e) {
                        return null;
                    }
                }),
                'output' => value(function () use ($workflow) {
                    try {
                        return $workflow->output ? Serializer::unserialize($workflow->output) : null;
                    } catch (\Throwable $e) {
                        return null;
                    }
                }),
                'event' => $workflow->event ? [
                    'id' => $workflow->event->id,
                    'event_source' => $workflow->event->event_source ?? null,
                    'event_data' => $workflow->event->event_data ?? null,
                ] : null,
                'steps' => $steps->map(function (WorkflowStep $step) {
                    return [
                        'id' => $step->id,
                        'action_id' => $step->action_id,
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
                'logs_count' => $logsCollection->count(),
                'exceptions_count' => $exceptionsCollection->count(),
                'last_log_at' => optional($logsCollection->sortByDesc('created_at')->first())->created_at,
                'last_exception_at' => optional($exceptionsCollection->sortByDesc('created_at')->first())->created_at,
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
        $workflow = Run::with(['event', 'sequence'])->findOrFail($workflowId);

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
            ->orderBy('id', 'asc')
            ->get();

        // Get workflow logs (latest first)
        $logsCollection = collect($workflow->logs);
        $logs = $logsCollection
            ->sortByDesc(function ($log) {
                return $log->created_at;
            })
            ->values()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'created_at' => $log->created_at,
                    'class' => $log->class,
                    'content' => $log->result ? Serializer::unserialize($log->result) : null,
                ];
            })
            ->toArray();

        // Get workflow exceptions (latest first)
        $exceptionsCollection = collect($workflow->exceptions);
        $exceptions = $exceptionsCollection
            ->sortByDesc(function ($e) {
                return $e->created_at;
            })
            ->values()
            ->map(function ($exception) {
                return [
                    'message' => $exception->exception ? Serializer::unserialize($exception->exception) : 'Unknown error',
                    'created_at' => $exception->created_at,
                ];
            })
            ->toArray();

        return response()->json([
            'data' => [
                'id' => $workflow->id,
                'status' => $workflow->status,
                'created_at' => $workflow->created_at,
                // 'started_at' => $workflow->started_at,
                // 'finished_at' => $workflow->finished_at,
                'arguments' => $workflow->arguments ? Serializer::unserialize($workflow->arguments) : null,
                'output' => $workflow->output ? Serializer::unserialize($workflow->output) : null,
                'event' => $workflow->event ? [
                    'id' => $workflow->event->id,
                    'event_source' => $workflow->event->event_source ?? null,
                    'event_data' => $workflow->event->event_data ?? null,
                    'created_at' => $workflow->event->created_at,
                ] : null,
                'sequence' => [
                    'id' => $workflow->sequence->id,
                    'name' => $workflow->sequence->name,
                ],
                'steps' => $steps->map(function (WorkflowStep $step) {
                    return [
                        'id' => $step->id,
                        'action_id' => $step->action_id,
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
                'logs_count' => $logsCollection->count(),
                'exceptions_count' => $exceptionsCollection->count(),
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

    public function rerun(Request $request, int $workflowId): JsonResponse
    {
        // Find the workflow run
        $originalRun = Run::with(['event', 'sequence.triggers', 'sequence.actions'])
            ->findOrFail($workflowId);

        // Verify workflow belongs to user's organization
        if ($originalRun->sequence->organization_id !== auth()->user()->currentOrganization->id) {
            return response()->json(['message' => 'Workflow not found'], 404);
        }

        // Check if workflow can be retried based on state machine rules
        $retryableStatuses = ['failed', 'waiting'];
        if (!in_array($originalRun->status, $retryableStatuses)) {
            return response()->json([
                'success' => false,
                'message' => "Cannot rerun workflow in '{$originalRun->status}' status. Only failed or waiting workflows can be retried."
            ], 400);
        }

        // Get the original trigger and event data
        $trigger = $originalRun->sequence->triggers->first();
        $originalEvent = $originalRun->event;

        if (!$trigger || !$originalEvent) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot rerun workflow: Missing trigger or event data'
            ], 400);
        }

        try {
            // Create workflow stub and start execution
            // Use start() for rerun (new execution) rather than resume() (continue existing)
            // This follows state machine: created -> pending -> running
            $workflow = WorkflowStub::fromStoredWorkflow($originalRun);
            $workflow->start($trigger, $originalEvent);

            Log::info('Workflow rerun initiated', [
                'original_workflow_id' => $originalRun->id,
                'sequence_id' => $originalRun->sequence_id,
                'original_status' => $originalRun->status,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow rerun started successfully',
                'data' => [
                    'original_workflow_id' => $originalRun->id,
                    'status' => $originalRun->fresh()->status ?? 'pending'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to rerun workflow', [
                'workflow_id' => $workflowId,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to rerun workflow: ' . $e->getMessage()
            ], 500);
        }
    }

    public function forceRerun(Request $request, int $workflowId): JsonResponse
    {
        // Find the workflow run
        $originalRun = Run::with(['event', 'sequence.triggers', 'sequence.actions'])
            ->findOrFail($workflowId);

        // Verify workflow belongs to user's organization
        if ($originalRun->sequence->organization_id !== auth()->user()->currentOrganization->id) {
            return response()->json(['message' => 'Workflow not found'], 404);
        }

        // Check if workflow can be force retried (pending, running)
        $forceRetryableStatuses = ['pending', 'running'];
        if (!in_array($originalRun->status, $forceRetryableStatuses)) {
            return response()->json([
                'success' => false,
                'message' => "Cannot force rerun workflow in '{$originalRun->status}' status. Only pending or running workflows can be force retried."
            ], 400);
        }

        // Get the original trigger and event data
        $trigger = $originalRun->sequence->triggers->first();
        $originalEvent = $originalRun->event;

        if (!$trigger || !$originalEvent) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot rerun workflow: Missing trigger or event data'
            ], 400);
        }

        try {
            // First, fail the current workflow to follow state machine transitions
            $currentWorkflow = WorkflowStub::fromStoredWorkflow($originalRun);
            $forceFailedException = new \Exception("Workflow force-failed by user for rerun");
            $currentWorkflow->fail($forceFailedException);

            Log::info('Workflow force-failed for rerun', [
                'workflow_id' => $originalRun->id,
                'original_status' => $originalRun->status,
                'user_id' => auth()->id(),
            ]);

            // // Clear existing logs and exceptions to reset the workflow
            // $originalRun->logs()->delete();
            // $originalRun->exceptions()->delete();

            // // Reset the workflow arguments to restart fresh
            // $originalRun->arguments = null;
            // $originalRun->output = null;
            // $originalRun->save();

            // Restart the same workflow (recycle the existing run)
            $workflow = WorkflowStub::fromStoredWorkflow($originalRun->fresh());
            $workflow->start($trigger, $originalEvent);

            Log::info('Workflow force rerun initiated (recycled)', [
                'workflow_id' => $originalRun->id,
                'sequence_id' => $originalRun->sequence_id,
                'original_status' => $originalRun->status,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow force rerun started successfully',
                'data' => [
                    'workflow_id' => $originalRun->id,
                    'status' => $originalRun->fresh()->status ?? 'pending',
                    'force_rerun' => true,
                    'recycled' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to force rerun workflow', [
                'workflow_id' => $workflowId,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to force rerun workflow: ' . $e->getMessage()
            ], 500);
        }
    }
}
