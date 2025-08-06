import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import axios from 'axios';
import SettingsLayout from '@/layouts/settings-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
    Plus,
    MoreHorizontal,
    Eye,
    Copy,
    Edit,
    Archive,
    Trash2,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApiKey {
    id: number;
    name: string;
    key_preview: string;
    prefix: string;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string;
    creator: {
        id: number;
        name: string;
        email: string;
    };
}

interface Props {
    apiKeys: ApiKey[];
}

export default function ApiKeys({ apiKeys }: Props) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRevealDialogOpen, setIsRevealDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
    const [revealingKey, setRevealingKey] = useState<ApiKey | null>(null);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [isRevealProcessing, setIsRevealProcessing] = useState(false);

    const createForm = useForm({
        name: '',
        prefix: 'live',
    });

    const editForm = useForm({
        name: '',
    });

    const revealForm = useForm({
        password: '',
    });

    // Handle newly created API key from session
    useEffect(() => {
        const session = (window as unknown as { Laravel?: { session?: { api_key?: string } } })?.Laravel?.session;
        const apiKey = session?.api_key;
        if (apiKey) {
            setNewlyCreatedKey(apiKey);
            // Clear from session to prevent showing again
            if (session) {
                delete session.api_key;
            }
        }
    }, []);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('organizations.settings.api-keys.store'), {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                createForm.reset();
                toast.success('API key created successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach((error) => {
                    toast.error(Array.isArray(error) ? error[0] : String(error));
                });
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingKey) return;

        editForm.put(route('organizations.settings.api-keys.update', editingKey.id), {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setEditingKey(null);
                editForm.reset();
                toast.success('API key updated successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach((error) => {
                    toast.error(Array.isArray(error) ? error[0] : String(error));
                });
            },
        });
    };

    const handleRevealSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!revealingKey) return;

        setIsRevealProcessing(true);
        revealForm.clearErrors();

        try {
            const response = await axios.post(route('organizations.settings.api-keys.reveal', revealingKey.id), {
                password: revealForm.data.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = response.data as { key?: string; errors?: { password?: string[] }; message?: string };

            if (data.key) {
                setRevealedKey(data.key);
                revealForm.reset();
                toast.success('API key revealed');
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data as { errors?: { password?: string[] }; message?: string };

                // Handle validation errors
                if (errorData.errors?.password) {
                    revealForm.setError('password', errorData.errors.password[0] || 'Invalid password');
                } else {
                    toast.error(errorData.message || 'Failed to reveal API key');
                }
            } else {
                toast.error('Failed to reveal API key');
            }
        } finally {
            setIsRevealProcessing(false);
        }
    };

    const openEditDialog = (apiKey: ApiKey) => {
        setEditingKey(apiKey);
        editForm.setData('name', apiKey.name);
        setIsEditDialogOpen(true);
    };

    const openRevealDialog = (apiKey: ApiKey) => {
        setRevealingKey(apiKey);
        setRevealedKey(null);
        revealForm.reset();
        setIsRevealDialogOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const archiveKey = (apiKey: ApiKey) => {
        router.post(route('organizations.settings.api-keys.archive', apiKey.id), {}, {
            onSuccess: () => {
                toast.success('API key archived');
            },
        });
    };

    const activateKey = (apiKey: ApiKey) => {
        router.post(route('organizations.settings.api-keys.activate', apiKey.id), {}, {
            onSuccess: () => {
                toast.success('API key activated');
            },
        });
    };

    const deleteKey = (apiKey: ApiKey) => {
        router.delete(route('organizations.settings.api-keys.destroy', apiKey.id), {
            onSuccess: () => {
                toast.success('API key deleted');
            },
        });
    };

    return (
        <SettingsLayout>
            <Head title="API Keys" />

            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
                        <p className="text-muted-foreground">
                            Manage API keys for your organization. Use these keys to authenticate API requests.
                        </p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create API Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create API Key</DialogTitle>
                                <DialogDescription>
                                    Create a new API key for your organization. Choose a descriptive name and environment.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateSubmit} className="space-y-4" autoComplete='off'>
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="e.g., Production API Key"
                                        required
                                        autoComplete='off'
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="prefix">Environment</Label>
                                    <Select
                                        value={createForm.data.prefix}
                                        onValueChange={(value) => createForm.setData('prefix', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="live">Live</SelectItem>
                                            <SelectItem value="test">Test</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createForm.processing}>
                                        {createForm.processing ? 'Creating...' : 'Create API Key'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Newly created API key alert */}
                {newlyCreatedKey && (
                    <div className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-green-800 flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5" />
                                API Key Created Successfully
                            </CardTitle>
                            <CardDescription className="text-green-700">
                                Your new API key has been generated. Make sure to copy it now as you won't be able to see it again.
                            </CardDescription>
                        </CardHeader>
                        <div>
                            <div className="flex items-center space-x-2">
                                <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                                    {newlyCreatedKey}
                                </code>
                                <Button
                                    size="sm"
                                    onClick={() => copyToClipboard(newlyCreatedKey)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setNewlyCreatedKey(null)}
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <div>
                        <CardTitle>API Keys</CardTitle>
                        <CardDescription>
                            {apiKeys.length === 0 ? 'No API keys created yet.' : `${apiKeys.length} API key(s)`}
                        </CardDescription>
                    </div>
                    <div>
                        {apiKeys.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground mb-4">No API keys created yet.</p>
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create your first API key
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Environment</TableHead>
                                        <TableHead>Status</TableHead>
                                        {/*<TableHead>Last Used</TableHead>*/}
                                        <TableHead>Created</TableHead>
                                        <TableHead>Created By</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys.map((apiKey) => (
                                        <TableRow key={apiKey.id}>
                                            <TableCell className="font-medium">
                                                {apiKey.name}
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                    {apiKey.key_preview}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={apiKey.prefix === 'live' ? 'default' : 'secondary'}>
                                                    {apiKey.prefix}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                                                    {apiKey.is_active ? 'Active' : 'Archived'}
                                                </Badge>
                                            </TableCell>
                                            {/*<TableCell>*/}
                                            {/*    {apiKey.last_used_at*/}
                                            {/*        ? formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true })*/}
                                            {/*        : 'Never'*/}
                                            {/*    }*/}
                                            {/*</TableCell>*/}
                                            <TableCell>
                                                {formatDistanceToNow(new Date(apiKey.created_at), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                {apiKey.creator.name}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => openRevealDialog(apiKey)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Reveal key
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditDialog(apiKey)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit name
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {apiKey.is_active ? (
                                                            <DropdownMenuItem onClick={() => archiveKey(apiKey)}>
                                                                <Archive className="mr-2 h-4 w-4" />
                                                                Archive
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => activateKey(apiKey)}>
                                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                                Activate
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onSelect={(e) => e.preventDefault()}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{apiKey.name}"? This action cannot be undone and will immediately invalidate the API key.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteKey(apiKey)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit API Key</DialogTitle>
                            <DialogDescription>
                                Update the name of your API key.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4" autoComplete='off'>
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    required
                                    autoComplete='off'
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editForm.processing}>
                                    {editForm.processing ? 'Updating...' : 'Update'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reveal Dialog */}
                <Dialog open={isRevealDialogOpen} onOpenChange={setIsRevealDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reveal API Key</DialogTitle>
                            <DialogDescription>
                                Enter your password to reveal the full API key.
                            </DialogDescription>
                        </DialogHeader>
                        {!revealedKey ? (
                            <form onSubmit={handleRevealSubmit} className="space-y-4" autoComplete='off'>
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={revealForm.data.password}
                                        onChange={(e) => revealForm.setData('password', e.target.value)}
                                        required
                                        autoComplete='off'
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsRevealDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isRevealProcessing}>
                                        {isRevealProcessing ? 'Revealing...' : 'Reveal Key'}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label>API Key</Label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <code className="flex-1 p-2 bg-muted border rounded text-sm font-mono">
                                            {revealedKey}
                                        </code>
                                        <Button
                                            size="sm"
                                            onClick={() => copyToClipboard(revealedKey)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={() => setIsRevealDialogOpen(false)}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </SettingsLayout>
    );
}
