import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Building2, CreditCard, Users } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@/components/ui/sidebar';
import AppLogo from '@/components/app-logo';

interface SettingsLayoutProps {
    children: React.ReactNode;
}

const settingsNavItems = [
    {
        title: 'General',
        href: route('organizations.settings.general'),
        icon: Building2,
    },
    {
        title: 'Team',
        href: route('organizations.settings.team'),
        icon: Users,
    },
    {
        title: 'Billing',
        href: route('organizations.settings.billing'),
        icon: CreditCard,
    },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <SidebarProvider defaultOpen>
            <div className="flex min-h-screen">
                <Sidebar variant="inset" collapsible="none">
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" asChild>
                                    <Link href={route('dashboard')} prefetch>
                                        <AppLogo />
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {settingsNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = route().current(item.href);

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                        >
                                            <Link href={item.href}>
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>

                {/* Main Content */}
                <div className="flex-1">
                    <header className="flex h-16 items-center border-b px-8">
                        <h1 className="text-lg font-semibold">Organization Settings</h1>
                    </header>
                    <main className="p-8">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
} 