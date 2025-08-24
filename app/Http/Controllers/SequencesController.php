<?php

namespace App\Http\Controllers;

use App\Http\Requests\Automation\UpdateSequenceRequest;
use App\Models\Automation\Run;
use App\Models\Automation\Sequence;
use App\Models\Integration;
use App\Services\AppDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Workflow\Serializers\Serializer;

class SequencesController extends Controller
{
    public function index(): Response
    {
        $organizationId = Auth::user()->currentOrganization->id;

        $sequences = Sequence::query()
            ->where('organization_id', $organizationId)
            ->with(['triggers', 'actions'])
            ->withCount(['triggers', 'actions'])
            ->latest()
            ->get();

        $workflows = Run::query()
            ->where('organization_id', $organizationId)
            ->latest()
            ->with(['logs', 'exceptions'])
            ->paginate();

        $workflows->transform(function (Run $wf) {

            return [
                'id' => $wf->id,
                'logs' => collect($wf->logs)
                    ->map(function (\Workflow\Models\StoredWorkflowLog $log) {
                        return [
                            'id' => $log->id,
                            'created_at' => $log->created_at,
                            'class' => $log->class,
                            'content' => Serializer::unserialize($log->result),
                        ];
                    })
                    ->toArray(),
                'exceptions' => collect($wf->exceptions)
                    ->map(function (\Workflow\Models\StoredWorkflowException $e) {
                        return Serializer::unserialize($e->exception);
                    })
                    ->toArray(),
                'arguments' => $wf->arguments ? Serializer::unserialize($wf->arguments) : null,
                'output' => $wf->output ? Serializer::unserialize($wf->output) : null,
            ];
        });

        return Inertia::render('sequences/index', [
            'sequences' => $sequences,
            'workflows' => $workflows,
        ]);
    }

    public function update(UpdateSequenceRequest $request, Sequence $sequence): RedirectResponse|JsonResponse
    {
        $this->authorize('update', $sequence);

        $validated = $request->validated();

        $sequence->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? $sequence->is_active),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'sequence' => $sequence->fresh(),
                'message' => 'Sequence updated successfully.',
            ]);
        }

        return redirect()
            ->route('automation.sequences.edit', $sequence)
            ->with('success', 'Sequence updated successfully.');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $organizationId = Auth::user()->currentOrganization->id;

        $sequence = Sequence::create([
            'organization_id' => $organizationId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => false, // Start as inactive
            'created_by' => Auth::id(),
        ]);

        return redirect()
            ->route('automation.sequences.edit', $sequence)
            ->with('success', 'Sequence created successfully!');
    }

    public function edit(Sequence $sequence): Response|JsonResponse
    {
        // Ensure the sequence belongs to the current organization
        $this->authorize('update', $sequence);

        $sequence->load(['triggers', 'actions']);

        // Get discovered apps instead of hardcoded ones
        $discoveryService = new AppDiscoveryService;
        $discoveredApps = $discoveryService->discoverApps();

        // Transform discovered apps to match the expected format
        $apps = collect($discoveredApps)->map(function ($app, $key) {
            return [
                'id' => $key, // Use the app key as ID
                'key' => $key,
                'name' => $app['name'],
                'class' => $app['class'],
                'description' => 'Discovered app with '.count($app['actions']).' actions and '.count($app['triggers']).' triggers',
                'icon_url' => null, // Could be added to the discovery system later
                'color' => '#3b82f6', // Default blue color
                'category' => 'automation',
                'triggers' => $app['triggers'],
                'actions' => $app['actions'],
                'resources' => $app['resources'],
            ];
        })->values();

        $integrations = Integration::query()
            ->where('organization_id', Auth::user()->currentOrganization->id)
            ->with('app')
            ->get(['id', 'app_id', 'name', 'type']);

        // Load triggers with their relationships
        $sequence->load([
            'triggers.app',
            'triggers.integration.app',
            'actions',
        ]);

        // Add webhook URLs for Plandalf webhook triggers
        $sequence->triggers->each(function ($trigger) {
            if ($trigger->isPlandalfWebhookTrigger()) {
                $trigger->webhook_url = $trigger->generateWebhookUrl();
            }
        });

        if (request()->expectsJson()) {
            return response()->json([
                'sequence' => $sequence,
                'apps' => $apps,
                'integrations' => $integrations,
            ]);
        }

        return Inertia::render('sequences/edit', [
            'sequence' => $sequence,
            'apps' => $apps,
            'integrations' => $integrations,
        ]);
    }

    /**
     * Authorize access to sequence based on organization
     */
    protected function authorize($ability, $sequence)
    {
        $organizationId = Auth::user()->currentOrganization->id;

        if ($sequence->organization_id !== $organizationId) {
            abort(403, 'You do not have permission to access this sequence.');
        }
    }
}
