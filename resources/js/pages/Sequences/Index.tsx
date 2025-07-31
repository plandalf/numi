import { Link, Head, router } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import { formatDate } from '@/lib/utils';
import { Search, Plus, ExternalLink, Play, Pause, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TutorialCard } from '@/components/onboarding/TutorialCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { type BreadcrumbItem, type PageProps } from '@/types';

interface Sequence {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  triggers_count?: number;
  nodes_count?: number;
}

interface Workflow {
  id: number;
  logs: any[];
  exceptions: any[];
  arguments: any;
  output: any;
}

interface SequencesIndexProps extends PageProps {
  sequences: Sequence[];
  workflows: {
    data: Workflow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Sequences',
    href: '/sequences',
  },
];

export default function Index({ auth, sequences, workflows }: SequencesIndexProps) {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (debouncedSearch) {
      router.get(
        route('automation.sequences.index'),
        { search: debouncedSearch },
        { preserveState: true, preserveScroll: true }
      );
    }
  }, [debouncedSearch]);

  const handleCreateSequence = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('automation.sequences.store'), {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        reset();
      },
    });
  };

  const filteredSequences = sequences.filter(sequence =>
    sequence.name.toLowerCase().includes(search.toLowerCase()) ||
    (sequence.description && sequence.description.toLowerCase().includes(search.toLowerCase()))
  );

  const tutorialActions = [
    {
      label: 'Create Sequence',
      onClick: () => setIsCreateDialogOpen(true),
      icon: Plus
    },
    {
      label: 'Documentation',
      onClick: () => window.open('https://www.plandalf.dev/docs/sequences', '_blank'),
      variant: 'outline' as const,
      icon: ExternalLink
    }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sequences" />

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Sequences
            </h1>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </div>

        {/* Tutorial Card */}
        {sequences.length === 0 && (
          <TutorialCard
            title="Welcome to Sequences!"
            description="Sequences are automated workflows that help you streamline your business processes. Create your first sequence to get started."
            actions={tutorialActions}
          />
        )}

        {/* Sequences Table */}
        {filteredSequences.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSequences.map((sequence) => (
                <TableRow key={sequence.id}>
                  <TableCell>
                    <Link
                      href={route('automation.sequences.edit', sequence.id)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {sequence.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sequence.is_active ? 'default' : 'secondary'}>
                      {sequence.is_active ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                      <span className="text-sm text-gray-600 truncate">
                        {sequence.description || 'No description'}
                      </span>
                  </TableCell>
                  <TableCell>
                      <span className="text-sm text-gray-500">
                        {sequence.triggers_count || 0} triggers
                      </span>
                  </TableCell>
                  <TableCell>
                      <span className="text-sm text-gray-500">
                        {sequence.nodes_count || 0} actions
                      </span>
                  </TableCell>
                  <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(sequence.updated_at)}
                      </span>
                  </TableCell>
                  <TableCell>
                    <Link href={route('automation.sequences.edit', sequence.id)}>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : sequences.length === 0 ? null : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-gray-500">No sequences found matching your search.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflows Debug Section (temporary) */}
        {workflows.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Executions</CardTitle>
              <CardDescription>
                Debug information for workflow executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.data.slice(0, 5).map((workflow) => (
                  <div key={workflow.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Workflow {workflow.id}</span>
                      <Badge variant="outline">
                        {workflow.exceptions.length > 0 ? 'Failed' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Logs: {workflow.logs.length} |
                      Exceptions: {workflow.exceptions.length}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Sequence Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sequence</DialogTitle>
            <DialogDescription>
              Create a new automated workflow sequence for your business processes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSequence}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Enter sequence name..."
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Describe what this sequence does..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create Sequence'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
