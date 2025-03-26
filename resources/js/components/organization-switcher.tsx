import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';

export function OrganizationSwitcher() {
    const { auth } = usePage<SharedData>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');

    const handleCreate = () => {
        router.post(route('organizations.store'), { name }, {
            onSuccess: () => {
                setIsOpen(false);
                setName('');
            },
        });
    };

    const handleSwitch = (id: number) => {
        router.post(route('organizations.switch', { organization: id }));
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg">
                            <Building2 className="mr-2 size-4" />
                            <span className="flex-1 text-left">
                                {auth.user.current_organization?.name ?? 'Select Organization'}
                            </span>
                            <ChevronDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        {auth.user.organizations.map((org) => (
                            <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.id)}>
                                {org.name}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem>
                                    <Plus className="mr-2 size-4" />
                                    Create Organization
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create new organization</DialogTitle>
                                    <DialogDescription>
                                        Use separate organizations to manage multiple clients or companies.
                                        To join an existing organization, ask to be invited as a team member.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Organization name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Acme Corp"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleCreate}>Create Organization</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
} 