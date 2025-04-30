import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';


export default function SequencesIndexPage({ sequences, workflows }) {

  return (
    <AppLayout>
      <div>
        <h3>Sequences</h3>
        {sequences.map((sequence) => (
          <div key={sequence.id} className="p-4 border-b border-gray-200">
            <Link href={`/sequences/${sequence.id}`}>
              <h2 className="text-lg font-semibold">{sequence.id} {sequence.name}</h2>
            </Link>
          </div>
        ))}


        <h3>Workflows</h3>
        <pre>{JSON.stringify(workflows.data,null,2)}</pre>
        {workflows.data.map((workflow) => (
          <div key={workflow.id} className="p-4 border-b border-gray-200">
            <Link href={`/workflows/${workflow.id}`}>
              <h2 className="text-lg font-semibold">{workflow.id} {workflow.name}</h2>
            </Link>
          </div>
        ))}

      </div>
    </AppLayout>
  )
}
