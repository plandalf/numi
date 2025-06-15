import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
    Plus, 
    Play, 
    Copy, 
    MoreHorizontal, 
    Trash2, 
    Settings,
    Zap,
    Mail,
    Webhook
} from 'lucide-react';

interface Trigger {
    id: number;
    event_name: string;
    target_type?: string;
    target_id?: number;
}

interface Node {
    id: number;
    type: string;
    arguments: Record<string, unknown>;
}

interface Edge {
    id: number;
    from_node_id: number;
    to_node_id: number;
}

interface Sequence {
    id: number;
    name: string;
    description?: string;
    organization_id: number;
    created_at: string;
    updated_at: string;
    triggers: Trigger[];
    nodes: Node[];
    edges: Edge[];
}

interface AutomationIndexProps {
    sequences: Sequence[];
}

const getNodeIcon = (type: string) => {
    switch (type) {
        case 'email':
            return <Mail className="h-4 w-4" />;
        case 'webhook':
            return <Webhook className="h-4 w-4" />;
        case 'custom_function':
            return <Zap className="h-4 w-4" />;
        default:
            return <Settings className="h-4 w-4" />;
    }
};

const getNodeTypeLabel = (type: string) => {
    switch (type) {
        case 'email':
            return 'Email';
        case 'webhook':
            return 'Webhook';
        case 'custom_function':
            return 'Custom Function';
        default:
            return type;
    }
};

export default function AutomationIndex({ sequences }: AutomationIndexProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const handleCreateSequence = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/automation/sequences', formData, {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                setFormData({ name: '', description: '' });
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleDuplicateSequence = (sequenceId: number) => {
        router.post(`/automation/sequences/${sequenceId}/duplicate`);
    };

    const handleDeleteSequence = (sequenceId: number) => {
        if (confirm('Are you sure you want to delete this automation sequence?')) {
            router.delete(`/automation/sequences/${sequenceId}`);
        }
    };

    return (
      <AppLayout>
        <Head title="Automation" />
        
        <div className="space-y-6 py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Automation</h1>
                    <p className="text-muted-foreground">
                        Create visual workflows to automate your business processes
                    </p>
                </div>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Automation
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreateSequence}>
                            <DialogHeader>
                                <DialogTitle>Create New Automation</DialogTitle>
                                <DialogDescription>
                                    Create a new automation sequence to streamline your workflows.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Order Confirmation Flow"
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe what this automation does..."
                                        rows={3}
                                    />
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
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Automation'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {sequences.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Zap className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Start by creating your first automation sequence to streamline your business processes.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Automation
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Triggers</TableHead>
                                <TableHead>Actions</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sequences.map((sequence) => (
                                <TableRow key={sequence.id}>
                                    <TableCell className="font-medium">
                                        {sequence.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-xs truncate text-muted-foreground">
                                            {sequence.description || 'No description'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {sequence.triggers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {sequence.triggers.map((trigger) => (
                                                    <Badge key={trigger.id} variant="secondary" className="text-xs">
                                                        {trigger.event_name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No triggers</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {sequence.nodes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {sequence.nodes.slice(0, 3).map((node) => (
                                                    <Badge key={node.id} variant="outline" className="text-xs">
                                                        <span className="mr-1">
                                                            {getNodeIcon(node.type)}
                                                        </span>
                                                        {getNodeTypeLabel(node.type)}
                                                    </Badge>
                                                ))}
                                                {sequence.nodes.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{sequence.nodes.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No actions</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(sequence.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm">
                                                <Play className="h-3 w-3 mr-1" />
                                                Test
                                            </Button>
                                            <Button asChild size="sm">
                                                <Link href={`/automation/sequences/${sequence.id}`}>
                                                    <Settings className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDuplicateSequence(sequence.id)}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDeleteSequence(sequence.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
          </div>
      </AppLayout>
    );
} 