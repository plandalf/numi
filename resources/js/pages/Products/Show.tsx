import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type Price, type Product } from '@/types/offer';
import { type BreadcrumbItem } from '@/types';
import { type PageProps as InertiaPageProps } from '@inertiajs/core';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import PriceForm from "@/components/prices/PriceForm";
import ProductForm from "@/components/Products/ProductForm";
import { toast } from "sonner";

interface ProductShowPageProps extends InertiaPageProps {
    product: Product;
    prices: Price[];
    listPrices: Price[];
}

export default function Show() {
    const { product, prices, listPrices, errors } = usePage<ProductShowPageProps>().props;

    const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<Price | undefined>(undefined);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);

    const openPriceForm = (price?: Price) => {
        setEditingPrice(price);
        setIsPriceFormOpen(true);
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
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setIsProductFormOpen(true)}> 
                            <Edit className="w-4 h-4 mr-2" /> Edit Product
                        </Button>
                        {/* Add other actions */}
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
                        {prices && prices.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Lookup Key</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Scope</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Interval</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prices.map((price: Price) => (
                                        <TableRow key={price.id}>
                                            <TableCell>{price.name || '-'}</TableCell>
                                            <TableCell>{price.lookup_key || '-'}</TableCell>
                                            <TableCell>{price.type}</TableCell> 
                                            <TableCell>{price.scope}</TableCell>
                                            <TableCell className="text-right">
                                                {['one_time', 'recurring'].includes(price.type) 
                                                    ? formatMoney(price.amount, price.currency)
                                                    : <span className="text-muted-foreground text-xs italic">Complex</span>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {price.type === 'recurring' 
                                                    ? `${price.recurring_interval_count || ''} ${price.renew_interval}(s)`
                                                    : '-'
                                                }
                                            </TableCell>
                                             <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${price.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {price.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openPriceForm(price)} title="Edit Price">
                                                     <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePrice(price.id)} title="Delete Price">
                                                     <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No prices defined yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Price Form Dialog */}
                <PriceForm 
                    open={isPriceFormOpen}
                    onOpenChange={setIsPriceFormOpen}
                    product={product} 
                    initialData={editingPrice} 
                    listPrices={listPrices || []}
                />
                
                {/* Product Form Dialog */}
                <ProductForm
                    open={isProductFormOpen}
                    onOpenChange={setIsProductFormOpen}
                    initialData={product}
                />
            </div>
        </AppLayout>
    );
} 