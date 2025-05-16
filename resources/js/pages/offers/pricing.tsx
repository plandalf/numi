import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';
import { type Offer as OfferType, type OfferVariant, type Product, type Price, OfferItem } from '@/types/offer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import SlotForm from '@/components/offers/SlotForm';
import { toast } from 'sonner';
import { formatMoney } from "@/lib/utils";
import { EditorProvider } from '@/contexts/offer/editor-context';

interface PricingPageProps extends PageProps {
    offer: OfferType;
    products: Product[];
    defaultCurrency: string;
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

/** @deprecated */
export default function Pricing() {
    const { offer, products, defaultCurrency } = usePage<PricingPageProps>().props;

    const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<any | null>(null);

    // function handleDeleteVariant(variant: OfferVariant) {
    //     if (confirm(`Are you sure you want to delete the variant "${variant.name || 'Unnamed Variant'}"?`)) {
    //         const toastId = toast.loading(`Deleting variant ${variant.name || 'Unnamed Variant'}...`);

    //         const { delete: destroy, processing } = useForm();
    //         destroy(route('offers.variants.destroy', { offer: offer.id, variant: variant.id }), {
    //             preserveScroll: true,
    //             onSuccess: () => {
    //                 toast.success(`Variant ${variant.name || 'Unnamed Variant'} deleted successfully`, {
    //                     id: toastId,
    //                 });
    //             },
    //             onError: (error: any) => {
    //                 toast.error(`Failed to delete variant: ${error.message || 'Unknown error'}`, {
    //                     id: toastId,
    //                 });
    //             }
    //         });
    //     }
    // };

    const layoutOffer = {
        id: offer.id,
        name: offer.name || '',
        created_at: offer.created_at,
        updated_at: offer.updated_at,
    };
    console.log(offer.slots[0])

    return (
      <EditorProvider offer={offer}>

        <AppOfferLayout offer={layoutOffer}>
            <Head title={`${offer.name || 'Untitled Offer'} - Pricing`} />

            <div className="space-y-6 w-full max-w-4xl mx-auto mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Checkout Slots</CardTitle>
                        <Button
                            onClick={() => {
                                setEditingSlot(null);
                                setIsSlotFormOpen(true);
                            }}
                            className="transition-all duration-200 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Slot
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {offer.slots?.map((slot: OfferItem) => (
                                <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-medium">{slot.name || 'Unnamed Slot'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Key: {slot.key} • {slot.is_required ? 'Required' : 'Optional'}
                                        </p>
                                        {slot.default_price ? (
                                            <p className="text-sm mt-1">
                                                Price: {formatMoney(slot.default_price.amount, slot.default_price.currency)}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-yellow-600 mt-1">No price set</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingSlot(slot);
                                                setIsSlotFormOpen(true);
                                            }}
                                        >
                                            <Pencil className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isSlotFormOpen && (

                <SlotForm
                open={isSlotFormOpen}
                onOpenChange={setIsSlotFormOpen}
                initialData={editingSlot}
                offerId={offer.id}
                defaultCurrency={defaultCurrency}
                products={products}
                />
            )}
        </AppOfferLayout>
        </EditorProvider>
    );
}
