import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';

interface NavGroup {
    label?: string;
    items: NavItem[];
}

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    return (
        <>
          {route().current()}
            {groups.map((group, groupIndex) => (
                <SidebarGroup key={groupIndex} className="px-3">
                    {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={route().current(item.route)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch className="relative px-2">
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        {item.hasNotification && (
                                            <div className="ml-auto h-2 w-2 rounded-full bg-amber-500" />
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
