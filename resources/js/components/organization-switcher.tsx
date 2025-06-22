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
import { useOrganizationSwitcher } from '@/hooks/use-organization-switcher';
import { usePage } from '@inertiajs/react';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';

export function OrganizationSwitcher() {
    const { auth } = usePage<{ auth: { user: { current_organization?: { name: string }; organizations: Array<{ id: number; name: string }> } } }>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');

    const { onSwitch, onCreate } = useOrganizationSwitcher({
        onCreate: () => {
            setIsOpen(false);
            setName('');
        },
    });

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2 py-2 h-auto">
              <div className="flex items-center gap-2">
                <Building2 className="size-4" />
                <span className="text-sm font-medium truncate">{auth.user.current_organization?.name ?? 'Select Organization'}</span>
              </div>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="start">
            {auth.user.organizations.map((org) => (
              <DropdownMenuItem key={org.id} onClick={() => onSwitch?.(org.id)}>
                <Building2 className="mr-2 size-4" />
                {org.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem>
                <Plus className="mr-2 size-4" />
                Create Organization
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

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
            <Button onClick={() => onCreate?.(name)}>Create Organization</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
}
