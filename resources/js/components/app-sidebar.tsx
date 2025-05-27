import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import {
  HomeIcon,
  PackageSearchIcon,
  OrigamiIcon,
  BlocksIcon,
  ToyBrickIcon,
  StoreIcon,
  BrushIcon,
ShoppingCartIcon,
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
      title: 'Orders',
      href: '/orders',
      icon: ShoppingCartIcon,
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
  {
    title: 'Organization',
    href: '/organizations/settings',
    icon: BlocksIcon,
  }
];

const footerNavItems: NavItem[] = [

];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />

            </SidebarFooter>
        </Sidebar>
    );
}
