import { SidebarMenuButton, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Link, usePage } from '@inertiajs/react';
import { NavUser } from '@/components/nav-user';
import { UserMenuContent } from '@/components/user-menu-content';
import type { SharedData } from '@/types/index';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { ChevronsUpDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
  const { auth } = usePage<SharedData>().props;

  const organization = useCurrentOrganization();


  return (
      <div>
        <div className="h-14 bg-gray-900 text-white flex justify-between items-center px-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" prefetch>
              <AppLogo />
            </Link>

            <OrganizationSwitcher />
          </div>

          <div className="flex items-center gap-4">

            <div>
              {
                organization?.on_trial && (
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {organization?.trial_days_left} days trial left
                  </div>
                )
              }
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-1">
                    <UserInfo user={auth.user} />
                    <ChevronsUpDown className="ml-auto size-4" />
                  </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="end"
                side={'bottom'}
              >
                <UserMenuContent user={auth.user} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <SidebarProvider defaultOpen={true} open={true} >
          {children}
        </SidebarProvider>
      </div>
    );
}
