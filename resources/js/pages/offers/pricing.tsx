import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { type Offer as OfferType, type OfferVariant } from '@/types/offer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import VariantForm from '@/components/offers/VariantForm';
import { FormEventHandler } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';

interface Props {
    offer: OfferType;
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

const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(amount / 100);
};

export default function Pricing({ offer }: Props) {
    const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<OfferVariant | null>(null);

    const { data, setData, put, post, delete: destroy, processing, errors } = useForm({
        name: offer.name || '',
        description: offer.description || '',
        product_image_id: offer.product_image_id || null,
        default_currency: offer.default_currency,
    });

    const onProductSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/offers/${offer.id}`, {
            preserveScroll: true,
        });
    };

    const handleVariantSubmit = (variantData: any) => {
        if (editingVariant) {
            const toastId = toast.loading(`Updating variant ${editingVariant.name}...`);
            
            put(route('offers.variants.update', { offer: offer.id, variant: editingVariant.id }), {
                ...variantData,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Variant ${editingVariant.name} updated successfully`, {
                        id: toastId,
                    });
                    setIsVariantFormOpen(false);
                    setEditingVariant(null);
                },
                onError: (errors) => {
                    toast.error(`Failed to update variant: ${Object.values(errors).flat().join(', ')}`, {
                        id: toastId,
                    });
                },
            });
        } else {
            const toastId = toast.loading(`Creating new variant...`);
            
            post(route('offers.variants.store', { offer: offer.id }), {
                ...variantData,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Variant created successfully`, {
                        id: toastId,
                    });
                    setIsVariantFormOpen(false);
                },
                onError: (errors) => {
                    toast.error(`Failed to create variant: ${Object.values(errors).flat().join(', ')}`, {
                        id: toastId,
                    });
                },
            });
        }
    };

    const handleDeleteVariant = (variant: OfferVariant) => {
        if (confirm(`Are you sure you want to delete the variant "${variant.name}"?`)) {
            const toastId = toast.loading(`Deleting variant ${variant.name}...`);
            
            destroy(route('offers.variants.destroy', { offer: offer.id, variant: variant.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Variant ${variant.name} deleted successfully`, {
                        id: toastId,
                    });
                },
                onError: (errors) => {
                    toast.error(`Failed to delete variant: ${errors.message || 'Unknown error'}`, {
                        id: toastId,
                    });
                }
            });
        }
    };

    // Create a compatible offer object for the AppOfferLayout
    const layoutOffer = {
        id: offer.id,
        name: offer.name || '',
        created_at: offer.created_at,
        updated_at: offer.updated_at,
    };

    return (
        <AppOfferLayout offer={layoutOffer}>
            <Head title={`${offer.name || 'Untitled Offer'} - Pricing`} />

            <div className="space-y-6 w-full max-w-7xl mx-auto mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Product Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onProductSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Enter product name"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="Describe your product"
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Product Image</Label>
                                <ImageUpload
                                    value={data.product_image_id}
                                    onChange={(mediaId) => setData('product_image_id', mediaId)}
                                    preview={offer.product_image?.url}
                                    disabled={processing}
                                />
                                {data.product_image_id}
                                {errors.product_image_id && (
                                    <p className="text-sm text-red-500">{errors.product_image_id}</p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="relative transition-all duration-200 active:scale-95"
                                >
                                    <div className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                                        Save Changes
                                    </div>
                                    {processing && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Price Variants</CardTitle>
                        <Button
                            onClick={() => {
                                setEditingVariant(null);
                                setIsVariantFormOpen(true);
                            }}
                            disabled={processing}
                            className="transition-all duration-200 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Variant
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {offer.variants.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No price variants yet. Add one to start selling your product.
                                </div>
                            ) : (
                                offer.variants.map((variant) => (
                                    <div
                                        key={variant.id}
                                        className="flex items-center justify-between p-4 rounded-lg border"
                                    >
                                        <div className="space-y-1">
                                            <h3 className="font-medium">{variant.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {variant.type === 'subscription' ? '🔄 Subscription' : '💰 One-time'} ·{' '}
                                                {variant.pricing_model === 'standard' && formatMoney(variant.amount || 0, variant.currency)}
                                                {variant.pricing_model === 'package' && `${formatMoney(variant.properties?.package?.unit_amount || 0, variant.currency)} per ${variant.properties?.package?.size || 1} units`}
                                                {(variant.pricing_model === 'graduated' || variant.pricing_model === 'volume') &&
                                                    `${variant.pricing_model === 'graduated' ? 'Progressive' : 'Volume-based'} pricing with ${variant.properties?.tiers?.length || 0} tiers`
                                                }
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    console.log('edit',variant);
                                                    setEditingVariant(variant);
                                                    setIsVariantFormOpen(true);
                                                }}
                                                disabled={processing}
                                                className="transition-all duration-200 active:scale-95"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteVariant(variant)}
                                                disabled={processing}
                                                className="relative transition-all duration-200 active:scale-95"
                                            >
                                                <div className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                                                    <Trash2 className="w-4 h-4" />
                                                </div>
                                                {processing && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isVariantFormOpen && (
            <VariantForm
                open={true}
                onOpenChange={setIsVariantFormOpen}
                initialData={editingVariant || undefined}
                offerId={offer.id}
                defaultCurrency={offer.default_currency}
            />
        )}
        </AppOfferLayout>
    );
}
