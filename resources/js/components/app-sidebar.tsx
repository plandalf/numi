import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
  HomeIcon,
  PackageSearchIcon,
  OrigamiIcon,
  BlocksIcon,
  ToyBrickIcon,
  StoreIcon,
  BrushIcon,
  PlugZapIcon, DatabaseZapIcon, BotIcon
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Offers',
        href: '/dashboard',
        icon: StoreIcon,
    },
    {
        title: 'Products',
        href: '/products',
        icon: PackageSearchIcon,
    },
    {
        title: 'Templates',
        href: '/templates',
        icon: BrushIcon,
    },
    {
        title: 'Integrations',
        href: '/integrations',
        icon: PlugZapIcon,
    },
  {
        title: 'Sequences',
        href: '/sequences',
        icon: BotIcon,
    },
];

const footerNavItems: NavItem[] = [

];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <OrganizationSwitcher />
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
