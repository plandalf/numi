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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [priceToDelete, setPriceToDelete] = useState<Price | undefined>(undefined);

  const [isAddExistingStripePriceDialogOpen, setIsAddExistingStripePriceDialogOpen] = useState(false);
  const openPriceForm = (price?: Price) => {
    setEditingPrice(price);

    /** Check if product is connected to an integration */
    if (product.integration_id && !price) {
      setIsAddExistingStripePriceDialogOpen(true);
    } else {
      setIsPriceFormOpen(true);
    }
  }

  const handleDeletePrice = () => {
    if (!priceToDelete) return;

    const toastId = toast.loading('Deleting price...');

    router.delete(route('products.prices.destroy', { product: product.id, price: priceToDelete.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Price deleted successfully.', { id: toastId });
        setPriceToDelete(undefined);
      },
      onError: (error) => {
        const errorMsg = Object.values(error).flat().join(", ");
        toast.error(`Failed to delete price: ${errorMsg || 'Unknown error'}`, { id: toastId });
      }
    });
  };

  const handleDeleteProduct = () => {
    const toastId = toast.loading('Deleting product...');

    router.delete(route('products.destroy', product.id), {
      onSuccess: () => {
        toast.success('Product deleted successfully', { id: toastId });
        router.visit(route('products.index'));
      },
      onError: (error) => {
        const errorMsg = Object.values(error).flat().join(", ");
        toast.error(`Failed to delete product: ${errorMsg || 'Unknown error'}`, { id: toastId });
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsProductFormOpen(true)}>
                <Edit className="w-4 h-4 mr-2" /> Edit product
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete product
              </Button>
            </div>
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
            onDelete={(price) => setPriceToDelete(price)}
            showActions
          />
        </div>

        {/* Price Form Dialog */}
        {isPriceFormOpen && <PriceForm
          open
          onOpenChange={setIsPriceFormOpen}
          product={product as any}
          initialData={editingPrice}
          listPrices={listPrices || []}
        /> }

        {/* Delete Price Dialog */}
        <AlertDialog open={!!priceToDelete} onOpenChange={(open) => !open && setPriceToDelete(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this price?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the price
                {priceToDelete?.gateway_price_id && ' from both Plandalf and Stripe'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePrice}
                className="bg-red-600 focus:ring-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                {prices.length > 0 && ' and all associated prices'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-red-600 focus:ring-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
