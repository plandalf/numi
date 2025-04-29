<?php

namespace App\Http\Controllers;

use App\Models\Automation\Sequence;
use App\Models\Automation\StoredWorkflow;
use Inertia\Inertia;
use Workflow\Serializers\Serializer;

class SequencesController extends Controller
{
    public function index()
    {
        $sequences = Sequence::query()
            ->where('organization_id', $organizationId = auth()->user()->currentOrganization->id)
            ->get();

        $workflows = StoredWorkflow::query()
            ->where('organization_id', $organizationId)
            ->latest()
            ->with(['logs', 'exceptions'])
            ->paginate();

        $workflows->transform(function (StoredWorkflow $wf) {

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
                'arguments' => Serializer::unserialize($wf->arguments),
                'output' => $wf->output ? Serializer::unserialize($wf->output) : 'no-output',
            ];
        });

        return Inertia::render('Sequences/Index', [
            'sequences' => $sequences,
            'workflows' => $workflows,
        ]);
    }
}
