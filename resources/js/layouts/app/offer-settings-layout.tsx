import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    offerId: number;
}

interface OfferNavItem {
    title: string;
    href: (offerId: number) => string;
    icon: null;
}

const sidebarNavItems: OfferNavItem[] = [
    {
        title: 'General',
        href: (offerId) => `/offers/${offerId}/settings`,
        icon: null,
    },
    {
        title: 'Customization',
        href: (offerId) => `/offers/${offerId}/settings/customization`,
        icon: null,
    },
    {
        title: 'Theme',
        href: (offerId) => `/offers/${offerId}/settings/theme`,
        icon: null,
    },
    {
        title: 'Notifications',
        href: (offerId) => `/offers/${offerId}/settings/notifications`,
        icon: null,
    },
    {
        title: 'Access Control',
        href: (offerId) => `/offers/${offerId}/settings/access`,
        icon: null,
    },
];

export default function OfferSettingsLayout({ children, offerId }: Props) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
            <aside className="w-full max-w-xl lg:w-48">
                <nav className="flex flex-col space-y-1 space-x-0">
                    {sidebarNavItems.map((item) => {
                        const href = item.href(offerId);
                        return (
                            <Button
                                key={href}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': currentPath === href,
                                })}
                            >
                                <Link href={href} prefetch>
                                    {item.title}
                                </Link>
                            </Button>
                        );
                    })}
                </nav>
            </aside>

            <Separator className="my-6 md:hidden" />

            <div className="flex-1 md:max-w-2xl">
                <section className="max-w-xl space-y-12">{children}</section>
            </div>
        </div>
    );
} 