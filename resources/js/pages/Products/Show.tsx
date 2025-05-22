import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Product, type Price } from '@/types/offer';
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
import PriceTable from '@/components/prices/PriceTable';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ProductForm from "@/components/Products/ProductForm";

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
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const [isAddExistingStripePriceDialogOpen, setIsAddExistingStripePriceDialogOpen] = useState(false);
  const openPriceForm = (price?: Price) => {
    setEditingPrice(price);

    /** Check if product is connected to an integration */
    if (product.integration_id) {
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
        <div className="mb-8 flex justify-between text-sm">
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label className="font-medium">Product name</Label>

              <p>
                {product.name}
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="font-medium">Lookup key</Label>

              <p>
                {product.lookup_key}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid gap-2">
              <Label className="font-medium">Product image</Label>
              <p className="text-xs text-muted-foreground">This will show on checkouts if you choose to use an image.</p>
            </div>
            {product.image ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 rounded-md cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent side="right" className="p-0 bg-transparent border-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-[300px] max-h-[300px] rounded-md shadow-lg"
                  />
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="w-24 h-24 rounded-md bg-gray-200" />
            )}
          </div>
          <div>
            <Button variant="outline" onClick={() => setIsProductFormOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Edit product
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium">Pricing</h2>
              <p className="text-sm text-muted-foreground">Shows all prices for this product.</p>
            </div>
            <Button onClick={() => openPriceForm()}>
              <Plus className="w-4 h-4 mr-2" /> Add Price
            </Button>
          </div>
          <PriceTable
            prices={prices}
            onEdit={openPriceForm}
            onDelete={(price) => handleDeletePrice(price.id)}
            showActions
            />
        </div>

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
          product={product as any}
        />

        {/* Product Form Dialog */}
        <ProductForm
          open={isProductFormOpen}
          onOpenChange={setIsProductFormOpen}
          initialData={product as any}
        />
      </div>
    </AppLayout>
  );
}
