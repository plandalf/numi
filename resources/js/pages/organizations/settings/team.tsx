import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SettingsLayout from '@/layouts/settings-layout';
import { type Organization, type User } from '@/types';
import { Head } from '@inertiajs/react';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface Props {
    organization: Organization & {
        users: User[];
    };
}

export default function Team({ organization }: Props) {
    const [inviteEmail, setInviteEmail] = useState('');

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement invite functionality
        setInviteEmail('');
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(organization.invite_link);
        // toast.success('Invite link copied to clipboard');
    };

    return (
        <SettingsLayout>
            <Head title="Team Settings" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                            Manage your team members and their roles.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organization.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>Member</TableCell>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Invite by Email</CardTitle>
                        <CardDescription>
                            Send an invitation email to a new team member.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvite} className="flex items-end gap-4">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                />
                            </div>
                            <Button type="submit">Send Invite</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
} 