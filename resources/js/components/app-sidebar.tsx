
import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import {
  PackageSearchIcon,
  BlocksIcon,
  StoreIcon,
  PlugZapIcon,
  BotIcon,
  ChevronsUpDown,
  CreditCardIcon,
  ComponentIcon,
  PaletteIcon
} from 'lucide-react';

const navGroups = [
    {
        items: [
            {
                title: 'Offers',
                href: '/dashboard',
                route: 'dashboard',
                icon: StoreIcon,
            },
            {
                title: 'Orders',
                href: '/orders',
                route: 'orders.*',
                icon: CreditCardIcon,
                hasNotification: true,
            },
            {
                title: 'Products',
                href: '/products',
                route: 'products.*',
                icon: PackageSearchIcon,
                hasNotification: true,
            },
            {
                title: 'Templates',
                href: '/templates',
                route: 'templates.*',
                icon: ComponentIcon,
            },
            {
                title: 'Automation',
                href: '/sequences',
                route: 'sequences.*',
                icon: BotIcon,
            },
        ]
    },
    {
        label: 'Settings',
        items: [
            {
                title: 'Themes',
                href: '/organizations/themes',
                route: 'organizations.themes.*',
                icon: PaletteIcon,
            },
            {
                title: 'Integrations',
                href: '/integrations',
                route: 'integrations.*',
                icon: PlugZapIcon,
                hasNotification: true,
            },
            {
                title: 'General',
                href: '/organizations/settings',
                route: 'organizations.settings.*',
                icon: BlocksIcon,
            }
        ]
    }
];



export function AppSidebar() {
    const { auth } = usePage().props as unknown as SharedData;
    
    // Hide notifications if user has seen the respective tutorials
    const showProductsNotification = !auth.user?.onboarding_info?.has_seen_products_tutorial;
    const showOrdersNotification = !auth.user?.onboarding_info?.has_seen_orders_tutorial;
    const showIntegrationsNotification = !auth.user?.onboarding_info?.has_seen_integrations_tutorial;
    console.log('info', auth.user?.onboarding_info);

    // Update navGroups to conditionally show notifications
    const dynamicNavGroups = navGroups.map(group => ({
        ...group,
        items: group.items.map(item => ({
            ...item,
            hasNotification: 
                item.title === 'Products' ? showProductsNotification :
                item.title === 'Orders' ? showOrdersNotification :
                item.title === 'Integrations' ? showIntegrationsNotification :
                item.hasNotification
        }))
    }));

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="p-3">
                <OrganizationSwitcher />
            </SidebarHeader>
            
            <SidebarContent>
                <NavMain 
                groups={dynamicNavGroups} 
                />
            </SidebarContent>

            <SidebarFooter className="p-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-1 cursor-pointer w-full">
                            <UserInfo user={auth.user} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={'top'}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
