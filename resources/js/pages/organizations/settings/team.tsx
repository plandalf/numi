import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SettingsLayout from '@/layouts/settings-layout';
import { SharedData, type Organization, type User } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Props {
    organization: Organization;
}

export default function Team({ organization }: Props) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const copyInviteLink = () => {
        navigator.clipboard.writeText(organization.invite_link);
        toast.success('Invite link copied to clipboard');
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            setIsDeleting(true);
            
            router.delete(route('organizations.settings.team.remove', userToDelete.id), {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setUserToDelete(null);
                },
                onFinish: () => {
                    setIsDeleting(false);
                }
            });
        }
    };

    return (
        <SettingsLayout>
            <Head title="Team Settings" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                            Manage your organization's team members and their roles.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organization?.users?.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="capitalize">{user.pivot.role}</TableCell>
                                        <TableCell>
                                            {user.id !== auth.user.id && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="text-destructive hover:text-destructive/90"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Invite Link</CardTitle>
                        <CardDescription>
                            Share this link with people you want to invite to your organization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Input
                            value={organization.invite_link}
                            readOnly
                            className="font-mono"
                        />
                        <Button variant="outline" size="icon" onClick={copyInviteLink}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {userToDelete?.name} from the organization?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Removing...' : 'Remove'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SettingsLayout>
    );
} 