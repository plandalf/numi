import AppOfferLayout from '@/layouts/app/app-offer-layout';
import OfferSettingsLayout from '@/layouts/app/offer-settings-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Offer {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    offer: Offer;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Offers',
        href: '/offers',
    },
];

export default function Settings({ offer }: Props) {
    return (
        <AppOfferLayout offer={offer}>
            <Head title={`${offer.name || 'Untitled Offer'} - Settings`} />
            <div className="px-4 py-6">
                <h1 className="text-2xl font-semibold mb-6">Settings for {offer.name || 'Untitled Offer'}</h1>
                
                <OfferSettingsLayout offerId={offer.id}>
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure the basic settings for your offer
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Add your settings form here */}
                            <p className="text-muted-foreground">Settings content coming soon...</p>
                        </CardContent>
                    </Card>
                </OfferSettingsLayout>
            </div>
        </AppOfferLayout>
    );
} 