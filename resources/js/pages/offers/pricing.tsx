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

export default function Pricing({ offer }: Props) {
    return (
        <AppOfferLayout offer={offer} >
            <Head title={`${offer.name || 'Untitled Offer'} - Pricing`} />
            <div>
                <h1 className="text-2xl font-semibold">Pricing for {offer.name || 'Untitled Offer'}</h1>


                Offer Options 
                // option groups 
                
                // or, price points

                // product must contain specific fields to fill the site with 
                // product.image 
            </div>

        </AppOfferLayout>
    );
} 