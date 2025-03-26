import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import type { PropsWithChildren } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Folder, HomeIcon, LayoutGrid, Menu, Search } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import AppLogo from '@/components/app-logo';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Offer {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    children: React.ReactNode;
    offer: Offer;
}

function getMainNavItems(): NavItem[] {
    return [
        {
            title: 'Edit',
            href: 'offers.edit',
        },
        {
            title: 'Pricing',
            href: 'offers.pricing',
        },
        {
            title: 'Integrate',
            href: 'offers.integrate',
        },
        {
            title: 'Sharing',
            href: 'offers.sharing',
        },
        {
            title: 'Settings',
            href: 'offers.settings',
        },
    ];
}

const rightNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

const activeItemStyles = '!text-teal-900 !dark:bg-teal-800 !dark:text-teal-100 !bg-teal-50';

interface AppHeaderProps {
    offer: Offer;
    isNameDialogOpen: boolean;
    setIsNameDialogOpen: (open: boolean) => void;
}

function OfferHeader({ offer, isNameDialogOpen, setIsNameDialogOpen }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const mainNavItems = getMainNavItems();
    const [name, setName] = useState(offer.name);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(route('offers.update', offer.id), {
            name: name,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setIsNameDialogOpen(false),
        });
    };

    return (
        <div className="border-sidebar-border/80 border-b">
            <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                {/* Mobile Menu */}
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-2 h-[34px] w-[34px]">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-sidebar flex h-full w-64 flex-col items-stretch justify-between">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <SheetHeader className="flex justify-start text-left">
                                <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                            </SheetHeader>
                            <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                <div className="flex h-full flex-col justify-between text-sm">
                                    <div className="flex flex-col space-y-4">
                                        {mainNavItems.map((item) => {
                                            const isActive = route().current(item.href);
                                            return (
                                                <Link 
                                                    key={item.title} 
                                                    href={item.href} 
                                                    className={cn(
                                                        "flex items-center space-x-2 font-medium p-2 rounded-md",
                                                        { "bg-gray-200": isActive }
                                                    )}
                                                >
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-col space-y-4">
                                        {rightNavItems.map((item) => (
                                            <a
                                                key={item.title}
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 font-medium"
                                            >
                                                {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                <span>{item.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Link href="/dashboard" prefetch className="mr-5">
                        <HomeIcon className="size-5" />
                    </Link>
            
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline"
                                    onClick={() => setIsNameDialogOpen(true)}
                                    className="text-sm font-medium cursor-text p-1 h-auto"
                                >
                                    {offer.name || 'Untitled Offer'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit Name</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Name your offer</DialogTitle>
                                <DialogDescription>
                                    Give your offer a name that describes what you're selling.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleNameSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Enter offer name"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Desktop Navigation */}
                <div className="ml-6 hidden h-full items-center space-x-6 lg:flex justify-center w-full">
                    <NavigationMenu className="flex h-full items-stretch">
                        <NavigationMenuList className="flex h-full items-stretch space-x-2">
                            {mainNavItems.map((item, index) => {
                                const isActive = route().current(item.href);
                                return (
                                    <NavigationMenuItem key={index} className="relative flex h-full items-center">
                                        <Link
                                            href={route(item.href, { offer: offer.id })}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                { [activeItemStyles]: isActive },
                                                'h-9 cursor-pointer px-3'
                                            )}
                                        >
                                            {item.title}
                                        </Link>
                                    </NavigationMenuItem>
                                );
                            })}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                <div className="ml-auto flex items-center space-x-2">
                    <div className="relative flex items-center space-x-1">
                        <Button variant="ghost" size="icon" className="group h-9 w-9 cursor-pointer">
                            <Search className="!size-5 opacity-80 group-hover:opacity-100" />
                        </Button>
                        <div className="hidden lg:flex">
                            {rightNavItems.map((item) => (
                                <TooltipProvider key={item.title} delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <a
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group text-accent-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                <span className="sr-only">{item.title}</span>
                                                {item.icon && <Icon iconNode={item.icon} className="size-5 opacity-80 group-hover:opacity-100" />}
                                            </a>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{item.title}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-10 rounded-full p-1">
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

export default function AppOfferLayout({ children, offer }: Props) {
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

    return (
        <AppShell>
            <OfferHeader 
                offer={offer} 
                isNameDialogOpen={isNameDialogOpen}
                setIsNameDialogOpen={setIsNameDialogOpen}
            />
            <AppContent>
                {children}
            </AppContent>
        </AppShell>
    );
}
