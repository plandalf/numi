import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type Price } from '@/types/offer';
import { type BreadcrumbItem } from '@/types';
import { type PageProps as InertiaPageProps } from '@inertiajs/core';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import PriceForm from "@/components/prices/PriceForm";
import { toast } from "sonner";
import { Integration } from "@/types/integration";
import AddExistingStripePriceDialog from "@/components/Products/AddExistingStripePriceDialog";
import { Product } from "@/types/product";
import PriceTable from '@/components/prices/PriceTable';

interface ProductShowPageProps extends InertiaPageProps {
    product: Product;
    prices: Price[];
    listPrices: Price[];
    integrations: Integration[];
}

export default function Show() {
    const { product, prices, listPrices, integrations, errors } = usePage<ProductShowPageProps>().props;

    const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<Price | undefined>(undefined);

    const [isAddExistingStripePriceDialogOpen, setIsAddExistingStripePriceDialogOpen] = useState(false);
    const openPriceForm = (price?: Price) => {
        setEditingPrice(price);

        /** Check if product is connected to an integration */
        if(product.integration_id) {
          setIsAddExistingStripePriceDialogOpen(true);
        } else {
          setIsPriceFormOpen(true);
        }
    }

    const handleDeletePrice = (priceId: number) => {
        if (!confirm('Are you sure you want to delete this price?')) return;

        router.delete(route('products.prices.destroy', { product: product.id, price: priceId }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Price deleted successfully.'),
            onError: (error) => {
                const errorMsg = Object.values(error).flat().join(", ");
                toast.error(`Failed to delete price: ${errorMsg || 'Unknown error'}`);
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Products', href: route('products.index') },
        { title: product.name, href: route('products.show', product.id) }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />

            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Product Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {product.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {product.lookup_key}
                        </p>
                    </div>
                </div>

                {/* Prices Section */}
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>Pricing</CardTitle>
                            <CardDescription>Manage prices for this product.</CardDescription>
                        </div>
                        <Button onClick={() => openPriceForm()}>
                            <Plus className="w-4 h-4 mr-2" /> Add Price
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <PriceTable
                            prices={prices}
                            onEdit={openPriceForm}
                            onDelete={(price) => handleDeletePrice(price.id)}
                            showActions
                        />
                    </CardContent>
                </Card>

                {/* Price Form Dialog */}
                <PriceForm
                    open={isPriceFormOpen}
                    onOpenChange={setIsPriceFormOpen}
                    product={product as any}
                    initialData={editingPrice}
                    listPrices={listPrices || []}
                />
                <AddExistingStripePriceDialog
                    open={isAddExistingStripePriceDialogOpen}
                    onOpenChange={setIsAddExistingStripePriceDialogOpen}
                    product={product}
                />
            </div>
        </AppLayout>
    );
}