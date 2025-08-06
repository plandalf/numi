import { Link } from '@inertiajs/react';
import { Building2, CreditCard, PaintbrushIcon, Users, Key, Package, Globe, Palette } from 'lucide-react';
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
import { useModules } from '@/hooks/use-modules';
interface SettingsLayoutProps {
    children: React.ReactNode;
}
export default function SettingsLayout({ children }: SettingsLayoutProps) {

    const modules = useModules();

    const settingsNavItems = [
        {
            title: 'General',
            route: 'organizations.settings.general',
            icon: Building2,
        },
        {
            title: 'Team',
            route: 'organizations.settings.team',
            icon: Users,
        },
        {
            title: 'API Keys',
            route: 'organizations.settings.api-keys.index',
            icon: Key,
        },
        {
            title: 'Fulfillment',
            route: 'organizations.settings.fulfillment',
            icon: Package,
        },
        {
             title: 'SEO & Branding',
             route: 'organizations.settings.seo',
             icon: Globe,
        },
        ...(modules.billing ? [
            {
                title: 'Billing',
                route: 'organizations.settings.billing.index',
                icon: CreditCard,
            },
        ] : []),
    ];

    return (
        <SidebarProvider defaultOpen>
            <div className="flex min-h-screen w-full">
                <Sidebar variant="inset" collapsible="none" className="border-r w-[255px] flex-shrink-0">
                    <SidebarHeader className="border-b h-14 py-0">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" asChild className="h-14">
                                    <Link href={route('dashboard')} prefetch>
                                        <AppLogo />
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu className="p-5 w-full">
                            {settingsNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = route().current(item.route);

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                        >
                                            <Link href={route(item.route)} prefetch active={route().current(item.route)}>
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
                <div className="flex-1 w-full">
                    <header className="flex h-14 items-center border-b px-8">
                        <h1 className="text-lg font-semibold">Organization Settings</h1>
                    </header>
                    <main className="p-8 w-full">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
