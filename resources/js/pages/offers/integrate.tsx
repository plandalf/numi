import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

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

export default function Integrate({ offer }: Props) {
    return (
        <AppOfferLayout offer={offer} breadcrumbs={breadcrumbs}>
            <Head title={`${offer.name || 'Untitled Offer'} - Integration`} />
            <div>
                <h1 className="text-2xl font-semibold">Integration for {offer.name || 'Untitled Offer'}</h1>
            </div>
        </AppOfferLayout>
    );
} 